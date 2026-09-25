import { useMemo, useState } from 'react';
import { SelectionContext } from './selectionContext';

export const SelectionProvider = ({ children }) => {
  const [selectedObject, setSelectedObject] = useState(null);
  const value = useMemo(() => ({ selectedObject, setSelectedObject }), [selectedObject]);

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
};