import sys

file_path = r'c:\Users\USUARIO\Documents\Programas Python\Proyecto\Compresores\MinuDoc-Word-Minutes-Generator\EmpresaDeCobros\Backend\apps\prestamos\views.py'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(file_path, 'w', encoding='utf-8') as f:
    for line in lines:
        if 'from .utils_docs import generate_loan_document' in line:
            f.write('from .utils_docs import generate_loan_document, save_document_to_storage\n')
        else:
            f.write(line)
