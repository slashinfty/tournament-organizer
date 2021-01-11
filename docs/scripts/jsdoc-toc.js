(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"EventManager.html\">EventManager</a>","id":"EventManager","children":[]},{"label":"<a href=\"Player.html\">Player</a>","id":"Player","children":[]},{"label":"<a href=\"Tournament.html\">Tournament</a>","id":"Tournament","children":[]},{"label":"<a href=\"Utilities.html\">Utilities</a>","id":"Utilities","children":[]}],
        openedIcon: ' &#x21e3;',
        saveState: false,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
