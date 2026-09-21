#!/bin/sh
# Como va el experimento: una opcion contra diez.
curl -s https://palomos.com.do/api/populares | python -c "
import sys, json
d = json.load(sys.stdin)
e = d.get('experimento', {})
print('Total emitidos:', d['total'])
print()
print('%-28s %8s %9s %9s' % ('', 'llegan', 'emiten', 'conversion'))
for rama, nombre in (('A', 'A - los diez disenos'), ('B', 'B - uno solo, sin elegir')):
    lleg = e.get(rama + ':elegir', 0)
    emi  = e.get(rama + ':emitido', 0)
    pct  = ('%.1f%%' % (100.0 * emi / lleg)) if lleg else '--'
    print('%-28s %8d %9d %9s' % (nombre, lleg, emi, pct))
a, b = e.get('A:elegir', 0), e.get('B:elegir', 0)
if min(a, b) < 100:
    print()
    print('Faltan datos: hacen falta ~100 por rama para que signifique algo.')
"
