export const Button = ({ children, className, ...props }) => (
  <button className={`px-4 py-2 bg-blue-600 text-white rounded ${className}`} {...props}>
    {children}
  </button>
);
