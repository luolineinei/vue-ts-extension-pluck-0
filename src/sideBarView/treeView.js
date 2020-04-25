"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const vscode = require("vscode")
const fs = require("fs")
const path = require("path")

class TreeViewProvider {
    constructor(path) {
        // this.workspaceRoot = workspaceRoot
        this.dirPath = path
        this._onDidChangeTreeData = new vscode.EventEmitter()
        this.onDidChangeTreeData = this._onDidChangeTreeData.event
    }

    refresh() {
        this._onDidChangeTreeData.fire()
    }

    getTreeItem(element) {
        return element
    }

    getChildren(element) {
        // console.log(element)
        if (element) {
            return Promise.resolve(this.getTreeItemArray(element.des))
        }
        else {
            // 点开activitybar，无操作，进入这里
            const fixedFolderPath = path.join(__dirname, this.dirPath)
            if (this.pathExists(fixedFolderPath)) {
                return Promise.resolve(this.getTreeItemArray(fixedFolderPath))
            }
            else {
                vscode.window.showInformationMessage('There is no such path')
                return Promise.resolve([])
            }
        }
    }

    getTreeItemArray(dirPath) {
        const toDep = (moduleName) => {
            const pathMy = path.join(dirPath, moduleName)
            if (this.pathExists(pathMy)) {
                if (!fs.lstatSync(pathMy).isDirectory()) {
                    return new TreeItemNode(moduleName, vscode.TreeItemCollapsibleState.None, pathMy, 'fileType', {
                        command: 'extension.showFileContent',
                        arguments: [
                            pathMy
                        ]
                    })
                } else {
                    // console.log('pathMy:'+JSON.stringify(pathMy,null,2))
                    return new TreeItemNode(moduleName, vscode.TreeItemCollapsibleState.Expanded, pathMy, 'dirType', {
                        command: 'extension.addFile',
                        arguments: [
                            pathMy
                        ]
                    })
                }
            }
        }
        if (this.pathExists(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
            const pathStringArray = fs.readdirSync(dirPath)
            return pathStringArray ? pathStringArray.map(dep => toDep(dep)) : []
        } else {
            return []
        }
    }

    pathExists(p) {
        try {
            fs.accessSync(p)
        }
        catch (err) {
            return false
        }
        return true
    }
}
exports.TreeViewProvider = TreeViewProvider

class TreeItemNode extends vscode.TreeItem {
    constructor(label, collapsibleState, des, contextValue, command) {
        super(label, collapsibleState)
        this.label = label
        this.collapsibleState = collapsibleState
        this.des = des
        this.contextValue = contextValue
        // this.collapsibleState为Collapsed时才会走有element的条件语句
        this.command = command
        this.iconPath = {
            light: path.join(__filename, '..', 'resources', 'light', this.getFileType(this.label)),
            dark: path.join(__filename, '..', 'resources', 'dark', this.getFileType(this.label))
        }
    }
    getFileType(fileName) {
        const ext = path.extname(fileName)
        if (this.collapsibleState !== vscode.TreeItemCollapsibleState.None) {
            return 'folder.svg'
        } else if (ext === '.js') {
            return 'edit.svg'
        } else if (ext === '.json') {
            return 'number.svg'
        } else {
            return 'string.svg'
        }
    }
}

exports.TreeItemNode = TreeItemNode
//# sourceMappingURL=nodeDependencies.js.map