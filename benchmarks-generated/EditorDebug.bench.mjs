import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./_runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("EditorDebug:render", 250, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/editor/debug",
        sections: 3,
        title: "EditorDebug"
      })
    ),
    runRerenderBenchmark("EditorDebug:rerender", 150, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/editor/debug",
        sections: 3,
        title: "EditorDebug"
      })
    ),
    runNavigationBenchmark("EditorDebug:nav", 20000, "/editor/debug")
  ];
}
