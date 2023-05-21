// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "create-rectangles") {
    let selectedNode = figma.currentPage.selection;
    let parentNodes = [];

    //create array of objects of selected elements with their meta data
    for (let i = 0; i < selectedNode.length; i++) {
      let parentArray = [];
      let currentChild = selectedNode[i] as BaseNode;
      while (currentChild.type != "PAGE") {
        parentArray.push(currentChild);
        let parentNode = currentChild.parent;
        let currentChildID = currentChild.id;
        let siblingNodes = parentNode?.children;
        if (parentNode != null) {
          currentChild = parentNode;
        }
      }
      parentNodes.push({
        key: i,
        node: selectedNode[i],
        parentsArray: parentArray.reverse(),
      });
    }

    //gets the deepest element in the tree of root frame
    let largestIndex = findLargestIndex(parentNodes)[0];
    let largestParentNode = findLargestIndex(parentNodes)[1];

    let excludeSelection = [];
    const skipNodes = [];
    const skipNodeMap = [];
    for (let i = 1; i < largestIndex; i++) {
      let skipNodeParents = [];

      //iterates through each selected nodes parents array from the object and then adds the node and its parent in a skip-list
      for (let j = 0; j < parentNodes.length; j++) {
        if (i < parentNodes[j].parentsArray.length) {
          skipNodes.push(parentNodes[j].parentsArray[i].id);
          skipNodeParents.push(parentNodes[j].parentsArray[i].parent);
        }

        //iterates through entire tree of root frame and selects a node if its not in the skip-list
        for (let parent of skipNodeParents) {
          if (parent != null) {
            for (let child of parent.children) {
              if (skipNodes.indexOf(child.id) > -1) {
                (child as FrameNode).opacity = 1;
                let isInSelection = excludeSelection.indexOf(child);
                if (isInSelection > -1) {
                  excludeSelection.splice(isInSelection, 1);
                }
              } else {
                (child as FrameNode).opacity = 0.06;
                excludeSelection.push(child);
              }
            }
          }
        }
      }
    }

    figma.currentPage.selection = [];
    figma.currentPage.selection = excludeSelection;
    figma.viewport.scrollAndZoomIntoView(excludeSelection);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};

//function to get the deepest node in the selection of nodes
function findLargestIndex(parentNodes: any) {
  let index = -1;
  let largestParent;
  for (let i = 0; i < parentNodes.length; i++) {
    if (parentNodes[i].parentsArray.length > index) {
      index = parentNodes[i].parentsArray.length;
      largestParent = parentNodes[i].parentsArray;
    }
  }
  return [index, largestParent];
}
