import os
import tempfile
import subprocess
import re
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from docxtpl import DocxTemplate
from num2words import num2words
import jinja2
from django.conf import settings
from django.utils import timezone
from config.storage_backends import DocumentosStorage
from .models import Prestamo, Cuota, Documento

# CLASE MAGICA PARA EVITAR EL ERROR DE DIVISION EN LA PLANTILLA
class SafeDivString(str):
    def __truediv__(self, other):
        s_self, s_other = str(self), str(other)
        if s_self == s_other: return s_self
        if not s_self: return s_other
        if not s_other: return s_self
        return f"{s_self}/{s_other}"
    def __rtruediv__(self, other):
        s_self, s_other = str(self), str(other)
        if s_self == s_other: return s_self
        return f"{s_other}/{s_self}"

# Mapeo de meses en español
MESES_ES = {
    1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL",
    5: "MAYO", 6: "JUNIO", 7: "JULIO", 8: "AGOSTO",
    9: "SEPTIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"
}

def save_document_to_storage(loan_id, file_path, doc_type, format_ext, user=None):
    try:
        loan = Prestamo.objects.get(id=loan_id)
        storage = DocumentosStorage()
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        file_name = f"prestamos/loan_{loan_id}_{doc_type}_{timestamp}.{format_ext}"
        with open(file_path, 'rb') as f:
            storage.save(file_name, f)
            url = storage.url(file_name)
        Documento.objects.create(
            cliente=loan.cliente,
            prestamo=loan,
            usuario_sube=user if (user and user.is_authenticated) else None,
            tipo_documento=f"{doc_type.upper()} ({format_ext.upper()})",
            nombre_archivo=os.path.basename(file_name),
            ruta_archivo=url,
            estado_documento="GENERADO",
            fecha_subida=timezone.now(),
            observaciones=f"Documento generado automáticamente."
        )
        return url, None
    except Exception as e:
        return None, f"Error al guardar en bucket/DB: {str(e)}"

def get_loan_data(loan: Prestamo):
    # Valores por defecto para evitar UndefinedError en plantillas
    data = {
        'SERIE_NUMERO': f"P-{loan.id:04d}",
        'NOMBRE_CLIENTE': "CLIENTE",
        'DPI_NÚMERO': "_",
        'NIT_NÚMERO': "C/F",
        'NOMBRE_EMPRESA': "PRENDASOL S.A.",
        'NIT_EMPRESA': "123456-7",
        'DIRECCIÓN_EMPRESA': "CIUDAD DE GUATEMALA",
        'MONTO_LETRAS': "_",
        'MONTO_NUMEROS': "0.00",
        'NÚMERO_CUOTAS': 0,
        'MONTO_CUOTA': "0.00",
        'DÍA_PAGO': "_",
        'MES_SEMANA': "_",
        'MES': "_",
        'SEMANA': "_",
        'PERIODICIDAD': "_",
        'FECHA_PRIMERA_CUOTA': "_",
        'FECHA_VENCIMIENTO': "_",
        'PORCENTAJE': "0",
        'PORCENTAJE_INTERES': "0",
        'MONTO_MORA': "0.00",
        'MONTO_MORA_FIJO': "0.00",
        'FECHA_EMISION': date.today().strftime('%d/%m/%Y'),
        'NOMBRE_DEL_DEUDOR': "CLIENTE",
        'REPRESENTANTE_LEGAL': "EL ASESOR",
        'NOMBRE_REPRESENTANTE': "EL ASESOR",
        'EDAD': "_",
        'ESTADO_CIVIL': "SOLTERO(A)",
        'PROFESIÓN': "NO ESPECIFICADA",
        'DIRECCIÓN_CLIENTE': "_",
        'NÚMERO_DPI': "_",
        'NÚMERO_PLAZOS': 0,
        'PLAZO': 0,
        'PLAZO_MES_SEMANA': "_",
        'FRECUENCIA_PAGOS': "_",
        'DESCRIPCIÓN_DETALLADA_GARANTÍA_1': "SIN GARANTÍA REGISTRADA",
        'DESCRIPCIÓN_DETALLADA_GARANTÍA_2': "",
        'DESCRIPCIÓN_DETALLADA_GARANTÍA_3': "",
        'MUNICIPIO': "GUATEMALA",
        'DEPARTAMENTO': "GUATEMALA",
        'DÍA': str(date.today().day),
        'MES_EMISION': MESES_ES.get(date.today().month, "ENERO"),
        'AÑO': str(date.today().year),
    }

    try:
        cliente = loan.cliente
        plan = loan.plan
        cuotas = loan.cuotas.all().order_by('numero_cuota')
        primera_cuota = cuotas.first()
        ultima_cuota = cuotas.last()
        
        if cliente:
            data['NOMBRE_CLIENTE'] = (cliente.nombre_completo or "CLIENTE").upper()
            data['NOMBRE_DEL_DEUDOR'] = data['NOMBRE_CLIENTE']
            data['DPI_NÚMERO'] = cliente.dpi or "_"
            data['NÚMERO_DPI'] = data['DPI_NÚMERO']
            data['NIT_NÚMERO'] = cliente.nit or "C/F"
            data['DIRECCIÓN_CLIENTE'] = (cliente.direccion or "_").upper()
            data['MUNICIPIO'] = (cliente.municipio or "GUATEMALA").upper()
            data['DEPARTAMENTO'] = (cliente.departamento or "GUATEMALA").upper()
            
            if cliente.fecha_nacimiento:
                today = date.today()
                data['EDAD'] = str(today.year - cliente.fecha_nacimiento.year - ((today.month, today.day) < (cliente.fecha_nacimiento.month, cliente.fecha_nacimiento.day)))
            
            if hasattr(cliente, 'informacion_laboral') and cliente.informacion_laboral:
                data['PROFESIÓN'] = (cliente.informacion_laboral.puesto or "NO ESPECIFICADA").upper()

        if plan:
            data['NÚMERO_CUOTAS'] = plan.numero_cuotas
            data['NÚMERO_PLAZOS'] = plan.numero_cuotas
            data['PLAZO'] = plan.numero_cuotas
            
            periodicidad_map = {
                'SEMANAL': 'SEMANA',
                'MENSUAL': 'MES',
                'DIARIO': 'DIA',
                'CATORCENAL': 'CATORCENA',
                'QUINCENAL': 'QUINCENA'
            }
            raw_period = (plan.periodicidad or "MENSUAL").upper()
            periodicidad_texto = periodicidad_map.get(raw_period, "MES")
            periodicidad_str = SafeDivString(periodicidad_texto)
            
            data['MES_SEMANA'] = periodicidad_str
            data['MES'] = periodicidad_str
            data['SEMANA'] = periodicidad_str
            data['PERIODICIDAD'] = periodicidad_str
            data['PLAZO_MES_SEMANA'] = periodicidad_str
            data['FRECUENCIA_PAGOS'] = periodicidad_str

        garantias_list = list(loan.garantias.all())
        def clean_g(text):
            if not text: return ""
            clean = text.split('(')[0].strip()
            return clean.upper()

        if len(garantias_list) > 0:
            data['DESCRIPCIÓN_DETALLADA_GARANTÍA_1'] = clean_g(garantias_list[0].descripcion)
        if len(garantias_list) > 1:
            data['DESCRIPCIÓN_DETALLADA_GARANTÍA_2'] = clean_g(garantias_list[1].descripcion)
        if len(garantias_list) > 2:
            data['DESCRIPCIÓN_DETALLADA_GARANTÍA_3'] = clean_g(garantias_list[2].descripcion)

        fecha_ref = loan.fecha_aprobacion or loan.fecha_solicitud or date.today()
        data['DÍA'] = str(fecha_ref.day)
        data['MES_EMISION'] = MESES_ES.get(fecha_ref.month, "ENERO")
        data['AÑO'] = str(fecha_ref.year)
        data['FECHA_EMISION'] = fecha_ref.strftime('%d/%m/%Y')

        monto_solicitado = float(loan.monto_solicitado)
        data['MONTO_NUMEROS'] = f"{monto_solicitado:,.2f}"
        
        try:
            data['MONTO_LETRAS'] = num2words(monto_solicitado, lang='es').upper() + " QUETZALES EXACTOS"
        except Exception:
            data['MONTO_LETRAS'] = f"{monto_solicitado:,.2f} QUETZALES"

        monto_cuota_val = 0
        if primera_cuota:
            monto_cuota_val = float(primera_cuota.monto_cuota)
            data['DÍA_PAGO'] = str(primera_cuota.fecha_vencimiento.day)
            data['FECHA_PRIMERA_CUOTA'] = primera_cuota.fecha_vencimiento.strftime('%d/%m/%Y')
            if ultima_cuota:
                data['FECHA_VENCIMIENTO'] = ultima_cuota.fecha_vencimiento.strftime('%d/%m/%Y')
        elif plan and plan.numero_cuotas > 0:
            interes_val = float(loan.interes or plan.interes or 0)
            monto_total_est = monto_solicitado + (monto_solicitado * (interes_val / 100))
            monto_cuota_val = monto_total_est / plan.numero_cuotas
        
        data['MONTO_CUOTA'] = f"{monto_cuota_val:,.2f}"
        data['PORCENTAJE'] = f"{loan.interes}"
        data['PORCENTAJE_INTERES'] = f"{loan.interes}"

        mora_porcentaje = float(plan.mora or 0) if plan else 0
        mora_monto_val = monto_cuota_val * (mora_porcentaje / 100)
        data['MONTO_MORA'] = f"{mora_monto_val:,.2f}"
        data['MONTO_MORA_FIJO'] = f"{mora_monto_val:,.2f}"

        if loan.admin_aprobador and hasattr(loan.admin_aprobador, 'full_name'):
            data['REPRESENTANTE_LEGAL'] = loan.admin_aprobador.full_name.upper()
            data['NOMBRE_REPRESENTANTE'] = data['REPRESENTANTE_LEGAL']

        # Crear duplicados sin acentos y en minúsculas
        mapping_sin_acentos = {
            'NÚMERO_CUOTAS': 'NUMERO_CUOTAS',
            'DÍA_PAGO': 'DIA_PAGO',
            'DIRECCIÓN_EMPRESA': 'DIRECCION_EMPRESA',
            'PORCENTAJE_INTERÉS': 'PORCENTAJE_INTERES',
            'DIRECCIÓN_CLIENTE': 'DIRECCION_CLIENTE',
            'NÚMERO_DPI': 'NUMERO_DPI',
            'NÚMERO_PLAZOS': 'NUMERO_PLAZOS',
            'DESCRIPCIÓN_DETALLADA_GARANTÍA_1': 'DESCRIPCION_DETALLADA_GARANTIA_1',
            'DESCRIPCIÓN_DETALLADA_GARANTÍA_2': 'DESCRIPCION_DETALLADA_GARANTIA_2',
            'DESCRIPCIÓN_DETALLADA_GARANTÍA_3': 'DESCRIPCION_DETALLADA_GARANTIA_3',
            'PROFESIÓN': 'PROFESION',
            'DÍA': 'DIA',
            'AÑO': 'ANO'
        }
        extras = {}
        for con_acento, sin_acento in mapping_sin_acentos.items():
            if con_acento in data:
                extras[sin_acento] = data[con_acento]
        data.update(extras)
        
        extra_data = {k.lower(): v for k, v in data.items()}
        data.update(extra_data)
        
        return data
    except Exception as e:
        print(f"Error crítico en get_loan_data: {str(e)}")
        # Retornamos lo que hayamos logrado recolectar hasta el error, 
        # que al menos tendrá los valores por defecto iniciales.
        return data

def generate_loan_document(loan_id, doc_type, out_format='docx'):
    try:
        loan = Prestamo.objects.get(id=loan_id)
        data = get_loan_data(loan)
        
        template_name = "pagare_template.docx" if doc_type == "pagare" else "contrato_template.docx"
        template_path = os.path.join(settings.BASE_DIR, "apps", "prestamos", "templates", template_name)
        
        if not os.path.exists(template_path):
            return None, f"Plantilla {template_name} no encontrada"

        doc = DocxTemplate(template_path)
        doc.render(data)
        
        temp_dir = tempfile.gettempdir()
        output_filename = f"{doc_type}_{loan_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.docx"
        output_path = os.path.join(temp_dir, output_filename)
        doc.save(output_path)
        
        if out_format == 'pdf':
            pdf_path = output_path.replace(".docx", ".pdf")
            subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', temp_dir, output_path], check=True)
            return pdf_path, None
                
        return output_path, None
    except Exception as e:
        return None, str(e)
