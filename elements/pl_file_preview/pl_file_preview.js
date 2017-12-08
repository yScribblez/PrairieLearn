/* eslint-env browser,jquery */
/* global PrairieUtil */

window.PLFilePreview = function(uuid) {
    this.uuid = uuid;

    var elementId = '#file-preview-' + uuid;
    this.element = $(elementId);
    if (!this.element) {
        throw new Error('File preview element ' + elementId + ' was not found!');
    }

    this.element.find('.btn-clipboard').click(function(e) {
        PrairieUtil.copyToClipboard($(e.currentTarget).attr('data-contents'));
        var copySuccessElement = $(e.currentTarget).parent().parent().find('.copy-success');
        copySuccessElement.fadeIn(300, function() {
            setTimeout(function() {
                copySuccessElement.fadeOut(300);
            }, 1000);
        });
        e.stopPropagation();
    });

    $('[data-toggle="tooltip"]').tooltip();
};
