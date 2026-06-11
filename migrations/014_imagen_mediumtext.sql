-- Ampliar campo imagen para soportar base64 (hasta ~4 MB)
ALTER TABLE productos MODIFY COLUMN imagen MEDIUMTEXT;
