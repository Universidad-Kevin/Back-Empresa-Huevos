import { registrar } from "../services/auditoriaService.js";

// Intercepta respuestas de mutaciones (POST/PUT/PATCH/DELETE) exitosas
// y registra la acción en la tabla auditoria.
export const auditMiddleware = (req, res, next) => {
  if (req.method === "GET" || req.method === "OPTIONS") return next();

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode < 400 && req.user) {
      const entidad = req.path.split("/")[1] || null;
      const entidad_id = req.params?.id ? parseInt(req.params.id) : null;
      registrar(req, `${req.method} ${req.path}`, entidad, entidad_id, {
        status: res.statusCode,
        body_keys: body && typeof body === "object" ? Object.keys(body) : null,
      });
    }
    return originalJson(body);
  };

  next();
};
