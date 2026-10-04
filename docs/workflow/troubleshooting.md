# 17. Troubleshooting & FAQ Guide

This guide details common development, runtime, database, and 3D rendering issues, diagnostic checks, and exact resolution steps.

---

## 1. Diagnostics Quick Reference

```
Is something broken?
├── Backend not responding? ──► Check Port 8080 & Docker DB containers (Section 2)
├── Frontend API calls failing with 401/403? ──► Check JWT token & LocalStorage (Section 3)
├── 3D Models failing to load or invisible? ──► Check GLB CORS & ModelLoader path (Section 4)
├── Flyway migration errors on startup? ──► Reset local Docker DB volume (Section 5)
└── Camera AR permission denied / black screen? ──► Check browser HTTPS / WebRTC permissions (Section 6)
```

---

## 2. Backend & Spring Boot Issues

### Issue 2.1: `Port 8080 is already in use`
* **Possible Cause:** A previously launched Java JVM or system process is holding port 8080.
* **How to Check:**
  * Windows PowerShell: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess`
  * Linux/macOS: `lsof -i :8080`
* **Solution:** Terminate the offending process or set `SERVER_PORT=8081` in `.env` / `application.yml`.

### Issue 2.2: `Connection to localhost:5432 refused`
* **Possible Cause:** PostgreSQL Docker container is stopped.
* **How to Check:** Run `docker compose ps` from the repository root.
* **Solution:** Start the database container: `docker compose up -d postgres`.

---

## 3. Authentication & Security Issues

### Issue 3.1: API returns `401 Unauthorized` on protected routes
* **Possible Cause:** Access token expired and refresh token was invalid or blacklisted.
* **How to Check:** Inspect browser DevTools → Application → Local Storage → `access_token` and `refresh_token`.
* **Solution:** Log in again at `/login` to acquire a fresh JWT token pair.

### Issue 3.2: `CORS header 'Access-Control-Allow-Origin' missing`
* **Possible Cause:** Frontend origin is not listed in `app.cors.allowed-origins` in `SecurityConfig.java`.
* **How to Check:** Check browser Console network headers on preflight `OPTIONS` requests.
* **Solution:** Add frontend host/port to `allowedOrigins` in `SecurityConfig.java` or `FRONTEND_URL` environment variable.

---

## 4. 3D WebGL & Model Loading Issues

### Issue 4.1: 3D Model loads as black or untextured mesh
* **Possible Cause:** Missing PBR lighting in the Three.js scene or missing texture files inside GLB container.
* **How to Check:** Verify that `LightingEnvironment.ts` is initialized with ambient and directional lights.
* **Solution:** Ensure `setupLightingAndEnvironment(scene, renderer)` is executed before loading the model.

### Issue 4.2: Model scale is enormous or microscopic
* **Possible Cause:** GLB geometry exported in millimeters or inches instead of meters.
* **How to Check:** Inspect `product.dimensions` (width, height, depth in cm) vs bounding box size computed in `ModelLoader.ts`.
* **Solution:** `ModelLoader.ts` automatically scales models by mapping physical cm dimensions to Three.js metric units ($1\text{ unit} = 1\text{ meter}$).

---

## 5. Database & Flyway Migration Issues

### Issue 5.1: `Flyway Validate Failed: Migration checksum mismatch for V...`
* **Possible Cause:** An existing SQL migration file in `db/migration/` was modified after being executed on the database.
* **How to Check:** Check Spring Boot startup logs for the specific migration version with checksum mismatch.
* **Solution:** In local development, wipe and recreate the database:
  ```bash
  docker compose down -v
  docker compose up -d postgres
  mvn clean compile
  ```

---

## 6. Live Camera AR Issues

### Issue 6.1: Camera AR button shows "Camera Access Denied"
* **Possible Cause:** User clicked "Block" on browser camera permission prompt or page is not served over secure context (`localhost` or `HTTPS`).
* **How to Check:** Check browser URL bar for the camera lock icon.
* **Solution:** Open site settings, change Camera permission to "Allow", and reload page.

### Issue 6.2: 3D placement reticle does not appear
* **Possible Cause:** Camera pointed at untextured ceiling or low-light area where floor plane cannot be calculated.
* **How to Check:** Point camera downwards toward a well-lit floor surface at an angle of roughly 20–45°.
* **Solution:** Move the device gently to allow the surface raycaster in `ARSurfaceManager.ts` to detect the floor plane.
