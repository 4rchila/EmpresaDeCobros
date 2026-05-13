
import os
import django
import json
from django.utils import timezone
from datetime import datetime, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.prestamos.models import Pago
from apps.users.models import Usuario
from django.db.models import Sum, Count

today = timezone.localdate()
start_of_day = timezone.make_aware(datetime.combine(today, time.min))
end_of_day = timezone.make_aware(datetime.combine(today, time.max))

pagos_hoy = Pago.objects.filter(
    fecha_pago__range=(start_of_day, end_of_day),
    estado="pendiente_validacion"
).values('usuario_registra').annotate(
    total_monto=Sum('monto_pagado'),
    conteo_pagos=Count('id')
)

output = []
for p in pagos_hoy:
    user_id = p['usuario_registra']
    if not user_id: continue
    
    user = Usuario.objects.get(pk=user_id)
    initials = "".join([n[0] for n in user.full_name.split() if n])[:2].upper()
    
    cartera = user.carteras_propias.first()
    ruta_nombre = cartera.nombre_cartera if cartera else "Ruta General"

    output.append({
        "id": f"coll-{user_id}",
        "advisorName": user.full_name,
        "advisorInitials": initials,
        "route": ruta_nombre,
        "amount": float(p['total_monto']),
        "clientsVisited": p['conteo_pagos'],
        "totalClients": 0,
        "date": today.strftime("%Y-%m-%d"),
        "time": timezone.now().strftime("%H:%M"),
        "status": "pending"
    })

print(json.dumps(output, indent=2))
