#!/bin/sh
# Como va el experimento: una opcion contra diez.
curl -s https://palomos.com.do/api/populares | python -c "
import sys, json
d = json.load(sys.stdin)
e = d.get('experimento', {})
print('Total emitidos:', d['total'])

def bloque(titulo, suf_l, suf_e, nota):
    print()
    print(titulo)
    print('  %-26s %8s %8s %11s' % ('', 'llegan', 'emiten', 'conversion'))
    tot_l = 0
    for r, n in (('A', 'A - los diez disenos'), ('B', 'B - uno solo, sin elegir')):
        l = e.get(r + suf_l, 0); m = e.get(r + suf_e, 0)
        tot_l += l
        pct = ('%.1f%%' % (100.0 * m / l)) if l else '--'
        print('  %-26s %8d %8d %11s' % (n, l, m, pct))
    if nota and tot_l:
        a = e.get('A' + suf_l, 0)
        print('  reparto de llegadas: %.0f%% / %.0f%%' % (100.0*a/tot_l, 100.0*(tot_l-a)/tot_l))
    return tot_l

u = bloque('POR NAVEGADOR  <- este es el bueno', ':elegir-unico', ':emitido-unico', True)
bloque('POR PULSACION  (cuenta reintentos, no personas)', ':elegir', ':emitido', True)

print()
if u < 200:
    print('Faltan datos: ~100 navegadores por rama para que signifique algo.')
    print('Los contadores por navegador arrancaron de cero el 21/09.')
"
