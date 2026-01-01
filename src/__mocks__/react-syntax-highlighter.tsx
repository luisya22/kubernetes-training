import React from 'react';

export const Prism = ({ children, ...props }: any) => {
  return <pre {...props}>{children}</pre>;
};

export default Prism;
