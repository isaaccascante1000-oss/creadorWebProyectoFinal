const TEXT_OBJECT_TYPES = new Set(['i-text', 'textbox', 'text']);

const serializeObject = (object) => {
  const { objects = [], ...properties } = object;
  const {
    type,
    left = 0,
    top = 0,
    width = 0,
    height = 0,
    scaleX = 1,
    scaleY = 1,
    fill = null,
    stroke = null,
    strokeWidth = 0,
    opacity = 1,
    text,
    fontFamily,
    fontSize,
    fontWeight,
    textAlign,
    canvasaiTemplate = null,
  } = properties;

  return {
    type,
    template: canvasaiTemplate,
    position: { x: left, y: top },
    dimensions: { width, height, scaleX, scaleY },
    style: { fill, stroke, strokeWidth, opacity },
    content: TEXT_OBJECT_TYPES.has(type)
      ? { text: text || '', fontFamily, fontSize, fontWeight, textAlign }
      : null,
    fabric: properties,
    children: objects.map(serializeObject),
  };
};

export const serializeCanvasForAI = (canvas) => {
  if (!canvas) {
    return {
      schemaVersion: '1.0',
      canvas: { width: 0, height: 0, background: null },
      objects: [],
    };
  }

  const canvasData = canvas.toJSON(['canvasaiTemplate']);

  return {
    schemaVersion: '1.0',
    canvas: {
      width: canvas.getWidth(),
      height: canvas.getHeight(),
      background: canvasData.background ?? null,
    },
    objects: (canvasData.objects || []).map(serializeObject),
  };
};
