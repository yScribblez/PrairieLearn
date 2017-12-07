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
    this.uploadElement = this.element.find('.btn-upload');
    this.clipboardElement = this.element.find('.btn-clipboard');
    this.copySuccessElement = this.element.find('.copy-success');
    this.fileUploadModalElement = this.element.find('.file-editor-upload');
    this.fileUploadReplaceButtonElement = this.fileUploadModalElement.find('.btn-replace');

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
    this.setEditorContents(currentContents);
    this.syncFileToHiddenInput();
    this.initializeFileUploadModal();

    this.clipboardElement.click(this.copyToClipboard.bind(this));
    this.uploadElement.click(this.openFileUploadModal.bind(this));

    // Initialize bootstrap tooltips
    this.element.find('[data-toggle="tooltip"]').tooltip();
};

window.PLFileEditor.prototype.initializeFileUploadModal = function() {
    var that = this;

    var dropTarget = this.fileUploadModalElement.find('.pl-dropzone');
    dropTarget.dropzone({
        url: '/none',
        autoProcessQueue: false,
        addedfile: function(file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var dataUrl = e.target.result;
                var commaSplitIdx = dataUrl.indexOf(',');
                var base64FileData = dataUrl.substring(commaSplitIdx + 1);

                var decodeFailed = false;
                try {
                    var contents = PrairieUtil.b64DecodeUnicode(base64FileData);
                } catch (e) {
                    decodeFailed = true;
                }

                that.resetFileUploadModal();
                if (decodeFailed || PrairieUtil.isBinary(contents)) {
                    that.fileUploadModalElement.find('.binary-error').show();
                } else {
                    that.fileUploadModalElement.find('code').text(contents);
                    that.fileUploadModalElement.find('pre').show();
                    that.fileUploadReplaceButtonElement.removeClass('disabled');
                    that.fileUploadReplaceButtonElement.prop('disabled', false);
                    that.uploadedFileContents = contents;
                }
            };

            reader.readAsDataURL(file);
        }.bind(this),
    });

    this.fileUploadModalElement.on('hidden.bs.modal', function() {
        that.resetFileUploadModal();
    });

    this.fileUploadReplaceButtonElement.click(function() {
        if (that.uploadedFileContents != null) {
            that.setEditorContents(that.uploadedFileContents);
        }
        that.fileUploadModalElement.modal('hide');
    });
};

window.PLFileEditor.prototype.syncFileToHiddenInput = function() {
    var base64EncodedFile = PrairieUtil.b64EncodeUnicode(this.editor.getValue());
    this.inputElement.val(base64EncodedFile);
    this.downloadElement.attr('href', 'data:data:application/octet-stream;charset=utf-8;base64,' + base64EncodedFile);
};

window.PLFileEditor.prototype.copyToClipboard = function() {
    var that = this;
    PrairieUtil.copyToClipboard(this.editor.getValue());
    this.copySuccessElement.fadeIn(300, function() {
        setTimeout(function() {
            that.copySuccessElement.fadeOut(300);
        }, 1000);
    });
};

window.PLFileEditor.prototype.openFileUploadModal = function() {
    this.fileUploadModalElement.modal('show');
};

window.PLFileEditor.prototype.resetFileUploadModal = function() {
    this.fileUploadModalElement.find('pre').hide();
    this.fileUploadModalElement.find('code').text('');
    this.fileUploadReplaceButtonElement.addClass('disabled');
    this.fileUploadReplaceButtonElement.prop('disabled', true);
    this.fileUploadModalElement.find('.binary-error').hide();
    this.uploadedFileContents = null;
};

window.PLFileEditor.prototype.setEditorContents = function(contents) {
    this.editor.setValue(contents);
    this.editor.gotoLine(1, 0);
    this.editor.focus();
};
