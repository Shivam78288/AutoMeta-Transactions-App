import React from "react";

const FormSelect = ({
  labelText,
  name,
  value,
  options,
  handleChange,
}: {
  labelText: string;
  name: string;
  value: string;
  options: string[];
  handleChange: (e: React.SyntheticEvent) => void;
}) => {
  return (
    <div className="form-row">
      <label htmlFor={name} className="form-label">
        {labelText || name}
      </label>
      <select
        name={name}
        value={value}
        onChange={handleChange}
        className="form-select"
      >
        {options.map((itemValue, index) => {
          return (
            <option key={index} value={itemValue}>
              {itemValue}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default FormSelect;
