import React from "react";

const FormRow = ({
  type,
  name,
  value,
  labelText,
  handleChange,
}: {
  type: string;
  name: string;
  value: string;
  labelText: string;
  handleChange: (e: React.SyntheticEvent) => void;
}) => {
  return (
    <div className="form-row">
      <label htmlFor={name} className="form-label">
        {labelText || name}
      </label>
      <input
        type={type}
        onChange={handleChange}
        value={value}
        name={name}
        className="form-input"
      />
    </div>
  );
};

export default FormRow;
