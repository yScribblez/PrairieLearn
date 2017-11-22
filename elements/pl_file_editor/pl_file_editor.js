/* eslint-env browser,jquery */
/* global ace , PrairieUtil */
window.PLFileEditor = function(uuid, options) {
    var elementId = '#file-editor-' + uuid;
    this.element = $(elementId);
    if (!this.element) {
        throw new Error('File upload element ' + elementId + ' was not found!');
    }

    this.inputElement = this.element.find('input');
    this.editorElement = this.element.find('.editor');
    this.downloadElement = this.element.find('.btn-download');
    this.clipboardElement = this.element.find('.btn-clipboard');

    this.editor = ace.edit(this.editorElement.get(0));
    this.editor.setTheme('ace/theme/chrome');
    this.editor.getSession().setUseWrapMode(true);
    this.editor.setShowPrintMargin(false);
    this.editor.getSession().on('change', this.syncFileToHiddenInput.bind(this));

    if (options.aceMode) {
        this.editor.getSession().setMode(options.aceMode);
    }

    if (options.aceTheme) {
        this.editor.setTheme(options.aceTheme);
    } else {
        this.editor.setTheme('ace/theme/chrome');
    }

    var currentContents = '';
    if (options.currentContents) {
        currentContents = PrairieUtil.b64DecodeUnicode(options.currentContents);
    }
    this.editor.setValue(currentContents);
    this.editor.gotoLine(1, 0);
    this.editor.focus();
    this.syncFileToHiddenInput();

    // this.clipboardElement.click(this.copyToClipboard.bind(this));
    this.clipboardElement.click(function() {
        PrairieUtil.copyToClipboard(this.editor.getValue());
    }.bind(this));
};

window.PLFileEditor.prototype.syncFileToHiddenInput = function() {
    var base64EncodedFile = PrairieUtil.b64EncodeUnicode(this.editor.getValue());
    this.inputElement.val(base64EncodedFile);
    this.downloadElement.attr('href', 'data:data:application/octet-stream;charset=utf-8;base64,' + base64EncodedFile);
};
