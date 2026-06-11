import https from "https";

const CULQI_API = "api.culqi.com";

function culqiRequest(method, path, body) {
  const secretKey = process.env.CULQI_SECRET_KEY;
  if (!secretKey) throw new Error("CULQI_SECRET_KEY no configurado");

  const payload = JSON.stringify(body);
  const options = {
    hostname: CULQI_API,
    path,
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) reject({ status: res.statusCode, body: parsed });
          else resolve(parsed);
        } catch {
          reject(new Error("Respuesta inválida de Culqi"));
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Crea un cargo en Culqi.
 * @param {object} opts
 * @param {number}  opts.amount         Monto en céntimos (ej. 2500 = S/25.00)
 * @param {string}  opts.email          Email del cliente
 * @param {string}  opts.sourceId       Token generado por Culqi.js en el frontend
 * @param {string}  [opts.description]  Descripción del cargo
 */
export const crearCargo = ({ amount, email, sourceId, description = "Compra CampOrganic" }) =>
  culqiRequest("POST", "/v2/charges", {
    amount,
    currency_code: "PEN",
    email,
    source_id: sourceId,
    description,
  });

/**
 * Obtiene un cargo por ID.
 */
export const obtenerCargo = (chargeId) =>
  culqiRequest("GET", `/v2/charges/${chargeId}`, {});
