# Reglas de seguridad de Firebase — Spelling Bee

## Cómo aplicarlas
1. Abre [console.firebase.google.com](https://console.firebase.google.com) → tu proyecto **spelling-bee-portillo**.
2. Menú izquierdo → **Realtime Database** → pestaña **Reglas (Rules)**.
3. Pega el contenido de [`firebase-rules.json`](firebase-rules.json) y pulsa **Publicar**.

## Qué hacen estas reglas
- **Todo está denegado por defecto** (`.read/.write: false` en la raíz). Solo se permite lo que está explícitamente bajo `spellingbee`.
- **`spellingbee/rooms/$room`**: lectura y escritura abiertas (la app no usa login de Firebase, los participantes entran por enlace). Se **valida** que el estado tenga `phase`, y se limita el tamaño de campos de texto (`institution`, `level`, `logoB64`, etc.) para evitar que alguien llene la base con basura.
- **`spellingbee/admin/master`**: lectura permitida (el login del maestro la necesita) pero **solo se puede escribir si aún no existe** (`!data.exists()`). Esto impide que alguien **sobrescriba** las credenciales del maestro después de la siembra inicial.
- **`spellingbee/admin/users`**: lectura/escritura permitidas (el panel del maestro los administra desde el cliente), con validación de formato (límite de salas 0-200, hash de 64 caracteres, etc.).

## ⚠️ Limitación importante (léelo)
La app autentica **en el navegador**: compara el hash de la contraseña que lee de la base. Por eso `admin` tiene que ser **legible**, lo que significa que **cualquiera que abra la base puede leer los hashes** (y, como la sal es fija y está en el código, podría intentar descifrarlos por fuerza bruta). Las reglas **no pueden** cerrar esto mientras el login siga siendo del lado cliente.

Para un concurso escolar el riesgo es bajo, pero si quieres seguridad real hay que mover el login a un **Cloud Function** (servidor) — un cambio mayor fuera del alcance actual.

## 🔒 Endurecimiento recomendado (opcional): Autenticación anónima
Bloquea a cualquiera que **no** esté usando la app (bots/escaneos de internet) exigiendo una sesión. No protege los hashes (siguen siendo legibles), pero reduce mucho la superficie de escritura.

**1. En la consola de Firebase:** Authentication → Sign-in method → habilita **Anónimo**.

**2. En `index.html`**, añade el SDK de auth junto a los otros scripts de Firebase:
```html
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
```
y dentro del bloque `tryInitFirebase()`, tras `window.rtdb = firebase.database();`, añade:
```js
firebase.auth().signInAnonymously().catch(e=>console.error("anon auth:", e));
```

**3. Cambia en las reglas** los `".write": true` de `rooms/$room` y `admin/users` por:
```json
".write": "auth != null"
```
y en `rooms/$room` el `".read": true` por `".read": "auth != null"` (deja `admin/master` y `admin/users` con `.read: true`, los necesita el login).

Con eso, solo las pestañas que realmente cargaron la app (y obtuvieron sesión anónima) pueden escribir salas.
