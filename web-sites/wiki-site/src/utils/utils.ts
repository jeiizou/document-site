import { groupBy } from 'lodash-es';

type DocsType = {
  id: string;
  path: string;
  sidebar: string;
};

export function createTreeData(docs: DocsType[]) {
  let cateDocs = docs.map((docs) => ({
    ...docs,
    cates: docs.id.split('/'),
  }));

  function groupDep(docsList: typeof cateDocs) {
    const groupedList = groupBy(docsList, (docs) => {
      return docs.cates[0];
    });

    for (const key of Object.keys(groupedList)) {
      let group = groupedList[key];
    }

    return groupedList;
  }

  const treeData = groupDep(cateDocs);
  return treeData;
}
