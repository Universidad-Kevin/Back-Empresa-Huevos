import pool from "../config/database.js";

export const _validarLogica = (cupon, total) => {
  if (!cupon.activo) return { valido: false, error: "El cupón no está activo" };
  const hoy = new Date().toISOString().slice(0, 10);
  if (cupon.fecha_inicio && hoy < cupon.fecha_inicio) return { valido: false, error: "El cupón aún no está vigente" };
  if (cupon.fecha_fin && hoy > cupon.fecha_fin) return { valido: false, error: "El cupón ha expirado" };
  if (cupon.usos_disponibles !== null && cupon.usos_disponibles <= 0) return { valido: false, error: "El cupón ya no tiene usos disponibles" };
  if (total < parseFloat(cupon.minimo_compra)) return { valido: false, error: `Compra mínima para este cupón: S/.${parseFloat(cupon.minimo_compra).toFixed(2)}` };
  return { valido: true };
};

export const _calcularDescuento = (cupon, total) => {
  let descuento = 0;
  if (cupon.tipo === "porcentaje") {
    descuento = (total * parseFloat(cupon.valor)) / 100;
    if (cupon.maximo_descuento) descuento = Math.min(descuento, parseFloat(cupon.maximo_descuento));
  } else {
    descuento = parseFloat(cupon.valor);
  }
  return Math.min(parseFloat(descuento.toFixed(2)), total);
};

export const validarCupon = async (req, res) => {
  const { codigo, total } = req.query;
  if (!codigo) return res.status(400).json({ error: "Código requerido" });
  const totalNum = parseFloat(total) || 0;

  try {
    const [[cupon]] = await pool.execute(
      "SELECT * FROM cupones WHERE codigo = ?",
      [codigo.toUpperCase().trim()]
    );
    if (!cupon) return res.status(404).json({ error: "Cupón no válido" });

    const { valido, error } = _validarLogica(cupon, totalNum);
    if (!valido) return res.status(400).json({ error });

    const descuento = _calcularDescuento(cupon, totalNum);
    res.json({
      success: true,
      data: {
        cupon_id: cupon.id,
        codigo: cupon.codigo,
        descripcion: cupon.descripcion,
        tipo: cupon.tipo,
        valor: cupon.valor,
        descuento,
      },
    });
  } catch (e) {
    console.error("Error validarCupon:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getAllCupones = async (req, res) => {
  if (req.user.rol !== "admin") return res.status(403).json({ error: "Solo admin" });
  try {
    const [rows] = await pool.execute("SELECT * FROM cupones ORDER BY creado_en DESC");
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const crearCupon = async (req, res) => {
  if (req.user.rol !== "admin") return res.status(403).json({ error: "Solo admin" });
  const { codigo, descripcion, tipo, valor, minimo_compra, maximo_descuento, usos_disponibles, fecha_inicio, fecha_fin } = req.body;

  if (!codigo || !tipo || valor === undefined) return res.status(400).json({ error: "Campos requeridos: codigo, tipo, valor" });
  if (!["porcentaje", "monto_fijo"].includes(tipo)) return res.status(400).json({ error: "Tipo inválido" });
  if (tipo === "porcentaje" && (valor < 0 || valor > 100)) return res.status(400).json({ error: "Porcentaje debe ser entre 0 y 100" });

  try {
    const [result] = await pool.execute(
      `INSERT INTO cupones (codigo, descripcion, tipo, valor, minimo_compra, maximo_descuento, usos_disponibles, fecha_inicio, fecha_fin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo.toUpperCase().trim(),
        descripcion || null,
        tipo,
        valor,
        minimo_compra || 0,
        maximo_descuento || null,
        usos_disponibles !== undefined && usos_disponibles !== "" ? parseInt(usos_disponibles) : null,
        fecha_inicio || null,
        fecha_fin || null,
      ]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Ya existe un cupón con ese código" });
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const actualizarCupon = async (req, res) => {
  if (req.user.rol !== "admin") return res.status(403).json({ error: "Solo admin" });
  const { id } = req.params;
  const { descripcion, tipo, valor, minimo_compra, maximo_descuento, usos_disponibles, fecha_inicio, fecha_fin, activo } = req.body;

  if (!tipo || valor === undefined) return res.status(400).json({ error: "Campos requeridos: tipo, valor" });
  if (!["porcentaje", "monto_fijo"].includes(tipo)) return res.status(400).json({ error: "Tipo inválido" });
  if (tipo === "porcentaje" && (parseFloat(valor) < 0 || parseFloat(valor) > 100))
    return res.status(400).json({ error: "Porcentaje debe ser entre 0 y 100" });

  try {
    const [[cupon]] = await pool.execute("SELECT id FROM cupones WHERE id = ?", [id]);
    if (!cupon) return res.status(404).json({ error: "Cupón no encontrado" });

    await pool.execute(
      `UPDATE cupones SET descripcion=?, tipo=?, valor=?, minimo_compra=?, maximo_descuento=?,
       usos_disponibles=?, fecha_inicio=?, fecha_fin=?, activo=? WHERE id=?`,
      [
        descripcion || null,
        tipo,
        valor,
        minimo_compra || 0,
        maximo_descuento || null,
        usos_disponibles !== undefined && usos_disponibles !== "" ? parseInt(usos_disponibles) : null,
        fecha_inicio || null,
        fecha_fin || null,
        activo !== undefined ? activo : 1,
        id,
      ]
    );
    res.json({ success: true, message: "Cupón actualizado" });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const eliminarCupon = async (req, res) => {
  if (req.user.rol !== "admin") return res.status(403).json({ error: "Solo admin" });
  const { id } = req.params;
  try {
    const [[cupon]] = await pool.execute("SELECT id FROM cupones WHERE id = ?", [id]);
    if (!cupon) return res.status(404).json({ error: "Cupón no encontrado" });
    await pool.execute("UPDATE cupones SET activo = 0 WHERE id = ?", [id]);
    res.json({ success: true, message: "Cupón desactivado" });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};
