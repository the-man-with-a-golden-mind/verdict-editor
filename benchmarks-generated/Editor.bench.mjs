import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./_runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("Editor:render", 250, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/editor",
        sections: 3,
        title: "Editor"
      })
    ),
    runRerenderBenchmark("Editor:rerender", 150, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "/editor",
        sections: 3,
        title: "Editor"
      })
    ),
    runNavigationBenchmark("Editor:nav", 20000, "/editor")
  ];
}
