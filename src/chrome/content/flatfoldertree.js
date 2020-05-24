Components.utils.import("resource:///modules/folderUtils.jsm");
Components.utils.import("resource:///modules/iteratorUtils.jsm");
Components.utils.import("resource:///modules/MailUtils.jsm");

var FlatFolderTree = {
    Strings: Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://flatfoldertree/locale/messenger.properties"),
	onLoad: function() {
		var menu = document.getElementById("folderPaneContext");
		if (menu)
			menu.addEventListener("popupshowing", FlatFolderTree.onFolderContextPopup, true);
		this.initialized = true;
	},
	onFolderContextPopup: function(aEvent) {
		var msgFolder;
		if (window.gFolderTreeView) {
			msgFolder =  gFolderTreeView.getFolderAtCoords(aEvent.clientX, aEvent.clientY);
		} else {
			msgFolder = GetMsgFolderFromUri(GetSelectedFolderURI(), true);
		}
		
        document.getElementById("folderPaneContext-FFT-breakout").disabled = document.getElementById("folderPaneContext-FFT-promote").disabled = !((msgFolder.hasSubFolders && msgFolder.parent) || (msgFolder.getFlag(Components.interfaces.nsMsgFolderFlags.ImapNoinferiors)));
        
        document.getElementById("folderPaneContext-FFT-restore").disabled = !(msgFolder.parent && ((msgFolder.parent.getStringProperty('FFTState') == 'Broken') || (msgFolder.parent.getStringProperty('FFTState') == 'Promoted')));
		
        document.getElementById("folderPaneContext-FFT-breakout").setAttribute('checked', msgFolder.getStringProperty('FFTState') == 'Broken' ? 'true' : 'false');
        
        document.getElementById("folderPaneContext-FFT-promote").setAttribute('checked', msgFolder.getStringProperty('FFTState') == 'Promoted' ? 'true' : 'false');
	},
	onFolderBreakout: function() {
		selFolder = GetSelectedMsgFolders();
		var msgFolder = selFolder.length == 1 ? selFolder[0] : null;
		if(!msgFolder) return;
		msgFolder.setStringProperty('FFTState', msgFolder.getStringProperty('FFTState') == 'Broken' ? 'false' : 'Broken');
		if(gFolderTreeView.mode != 'flat')
			gFolderTreeView.mode = 'flat';
		gFolderTreeView._rebuild();
	},
    onFolderPromote: function() {
        selFolder = GetSelectedMsgFolders();
        var msgFolder = selFolder.length == 1 ? selFolder[0] : null;
        if(!msgFolder) return;
        msgFolder.setStringProperty('FFTState', msgFolder.getStringProperty('FFTState') == 'Promoted' ? 'false' : 'Promoted');
        if(gFolderTreeView.mode != 'flat')
            gFolderTreeView.mode = 'flat';
        gFolderTreeView._rebuild();
    },
    onFolderRestore: function() {
        selFolder = GetSelectedMsgFolders();
        var msgFolder = selFolder.length == 1 ? selFolder[0] : null;
        if(!msgFolder || !msgFolder.parent) return;
        msgFolder.parent.setStringProperty('FFTState', 'false');
        if(gFolderTreeView.mode != 'flat')
            gFolderTreeView.mode = 'flat';
        gFolderTreeView._rebuild();
    }
};

window.addEventListener("load", FlatFolderTree.onLoad, false);

let gFlatFolderTreeMode = {
	__proto__: IFolderTreeMode,

	generateMap: function ftv_flat_generateMap(ftv) {
		let accounts = gFolderTreeView._sortedAccounts();

		let accountMap = [];

		function get_children(folder, parent, level)
		{
			var children = [];
			var child;

			for (let subFolder of fixIterator(folder.subFolders, Components.interfaces.nsIMsgFolder)) {
                if(subFolder.getStringProperty('FFTState') == 'Broken' && subFolder.hasSubFolders) {
                    children = children.concat(get_children(subFolder, folder, level));
                } else if(subFolder.getStringProperty('FFTState') == 'Promoted' && subFolder.hasSubFolders) {
                    child = new ftvItem(subFolder);
                    child._parent = parent;
                    child._level = level + 1;
                    child._children = [];
                    children.push(child);
                    children = children.concat(get_children(subFolder, folder, level));
				} else {
					child = new ftvItem(subFolder);
					child._parent = parent;
					child._level = level + 1;
					children.push(child);
				}
			}

			children.sort(function (a, b) {
				let sortKey = a._folder.compareSortKeys(b._folder);
				if (sortKey)
					return sortKey;
				return a.text.toLowerCase() > b.text.toLowerCase();
			});

			return children;
		}

		for (account of accounts)
		{
			let a = new ftvItem(account.incomingServer.rootFolder);
			a._children = get_children(a._folder, a._folder, 0);
			accountMap.push(a);
		}

		return accountMap;
	},
	getParentOfFolder: function(aFolder) {
		return aFolder.parent;
	},
	getFolderForMsgHdr: function IFolderTreeMode_getFolderForMsgHdr(aMsgHdr) {
		return aMsgHdr.folder;
	},
	onFolderAdded: function IFolderTreeMode_onFolderAdded(aParent, aFolder) {
		gFolderTreeView.addFolder(aParent, aFolder);
	}
};

gFolderTreeView.registerFolderTreeMode('flat', gFlatFolderTreeMode, FlatFolderTree.Strings.GetStringFromName("FolderPaneTitleFlattenedFolders"));
