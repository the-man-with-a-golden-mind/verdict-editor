#!/usr/bin/env node
/**
 * Adds compileBindingsJS and evalBindingsJsonJS to verdict.mjs for notebook per-cell eval.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = path.join(root, "public/lib/verdict.mjs");
const outPath = path.join(root, "public/lib/verdict-notebook.mjs");

let code = fs.readFileSync(srcPath, "utf8");
const needsCompile = !code.includes("compileBindingsJS");
const needsEvalJson = !code.includes("evalBindingsJsonJS");

if (!needsCompile && !needsEvalJson && fs.existsSync(outPath)) {
  console.log("verdict-notebook.mjs already patched");
  process.exit(0);
}

const insert = `
var compileBindingsJS = function(src) {
  var v = compileBindings(src);
  if (v instanceof Right) {
    return {
      ok: true,
      output: stringifyWithIndent(2)(encodeProgramVM(v.value0)),
      error: ""
    };
  }
  if (v instanceof Left) {
    return { ok: false, output: "", error: v.value0 };
  }
  throw new Error("compileBindingsJS: unexpected result");
};
var evalBindingsJsonJS = function(src, names) {
  var sigMap = {};
  signaturesJS(src).forEach(function(s) {
    sigMap[s.name] = s.signature;
  });
  var filterNames = names && names.length ? names : null;
  var nullary = function(mod5) {
    return mapMaybe(function(v2) {
      var $93 = $$null(v2.params);
      if ($93) {
        return new Just(v2.name);
      }
      return Nothing.value;
    })(moduleDecls(mod5));
  };
  var evalBindingJson = function(prog) {
    return function(name2) {
      var $94 = member(name2)(prog.functions);
      if ($94) {
        return new Just(function() {
          var v2 = runProgram({
            version: prog.version,
            constants: prog.constants,
            functions: prog.functions,
            stateMachines: prog.stateMachines,
            exports: prog.exports,
            metadata: prog.metadata,
            typeTable: prog.typeTable,
            capabilities: prog.capabilities,
            verification: prog.verification,
            limits: prog.limits,
            entrypoint: name2
          });
          if (v2 instanceof Right) {
            return {
              name: name2,
              ok: true,
              json: encodeValueJson(v2.value0),
              typeSig: sigMap[name2] || "",
              error: ""
            };
          }
          if (v2 instanceof Left) {
            return {
              name: name2,
              ok: false,
              json: null,
              typeSig: sigMap[name2] || "",
              error: v2.value0
            };
          }
          throw new Error("evalBindingsJsonJS: unexpected runProgram result");
        }());
      }
      return Nothing.value;
    };
  };
  var v = compileBindings(src);
  var v1 = parseVerdict(src);
  if (v1 instanceof Right && v instanceof Right) {
    var results = mapMaybe(evalBindingJson(v.value0))(nullary(v1.value0));
    if (filterNames) {
      return results.filter(function(r) {
        return filterNames.indexOf(r.name) >= 0;
      });
    }
    return results;
  }
  return [];
};
`;

if (needsCompile || needsEvalJson) {
  if (!code.includes("var compileBindingsJS")) {
    code = code.replace("export {", insert + "export {");
  }
  if (!code.includes("  compileBindingsJS,")) {
    code = code.replace("  evalBindingsJS,", "  evalBindingsJS,\n  compileBindingsJS,\n  evalBindingsJsonJS,");
  } else if (!code.includes("  evalBindingsJsonJS,")) {
    code = code.replace("  compileBindingsJS,", "  compileBindingsJS,\n  evalBindingsJsonJS,");
  }
}

fs.writeFileSync(outPath, code);
console.log("Wrote", outPath);
