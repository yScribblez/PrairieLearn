import prairielearn as pl
import lxml.html
import lxml.etree
from itertools import chain
import chevron
import os


def stringify_children(node):
    parts = ([node.text] +
             list(chain(*([c.text, lxml.etree.tostring(c, with_tail=False).decode('utf-8'), c.tail] for c in node.getchildren()))) +
             [node.tail])
    # filter removes possible Nones in texts and tails
    return ''.join(
        chunk for chunk in chain(
            (node.text,),
            chain(*((lxml.etree.tostring(child, with_tail=False).decode('utf-8'), child.tail) for child in node.getchildren())),
            (node.tail,)) if chunk)
    return ''.join(filter(None, parts))


def prepare(element_html, element_index, data):
    element = lxml.html.fragment_fromstring(element_html)
    pl.check_attribs(element, required_attribs=['file_name'], optional_attribs=['type', 'directory', 'label'])


def render(element_html, element_index, data):
    element = lxml.html.fragment_fromstring(element_html)

    # Get file name or raise exception if one does not exist
    file_name = pl.get_string_attrib(element, 'file_name')

    # Get type (default is static)
    file_type = pl.get_string_attrib(element, 'type', 'static')

    # Get directory (default is clientFilesQuestion)
    file_directory = pl.get_string_attrib(element, 'directory', 'clientFilesQuestion')

    # Get label (default is file_name)
    file_label = pl.get_string_attrib(element, 'label', file_name)

    # Get base url, which depends on the type and directory
    if file_type == 'static':
        if file_directory == 'clientFilesQuestion':
            base_url = data['options']['client_files_question_url']
        elif file_directory == 'clientFilesCourse':
            base_url = data['options']['client_files_course_url']
        else:
            raise ValueError('directory "{}" is not valid for type "{}" (must be "clientFilesQuestion" or "clientFilesCourse")'.format(file_directory, file_type))
    elif file_type == 'dynamic':
        if pl.has_attrib(element, 'directory'):
            raise ValueError('no directory ("{}") can be provided for type "{}"'.format(file_directory, file_type))
        else:
            base_url = data['options']['client_files_question_dynamic_url']
    else:
        raise ValueError('type "{}" is not valid (must be "static" or "dynamic")'.format(file_type))

    # Get full url
    file_url = os.path.join(base_url, file_name)

    # Dump all children
    child_html = ''
    for child in element:
        child_html += lxml.etree.tostring(child).decode('utf-8')

    html_params = {
        'file_name': file_name,
        'file_url': file_url,
        'uuid': pl.get_uuid(),
        'files_api_url': data['options']['files_api_url'],
        'child_html': stringify_children(element)
    }

    with open('pl_file_download_2.mustache', 'r', encoding='utf-8') as f:
        html = chevron.render(f, html_params).strip()

    return html

    # Create and return html
    return '<a href="' + file_url + '" download>' + file_label + '</a>'
