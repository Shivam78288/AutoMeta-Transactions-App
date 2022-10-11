import { TableColumnType, TableRowType } from "../types/types";

const column: TableColumnType[] = [
  { heading: "Function", value: "txType", key: 1 },
  { heading: "From", value: "From", key: 2 },
  { heading: "To", value: "To", key: 3 },
  { heading: "Token", value: "Token", key: 4 },
  { heading: "Amount", value: "Amount", key: 5 },
  { heading: "Status", value: "Status", key: 6 },
];

const Table = ({ data }: { data: any }) => {
  return (
    <table>
      <thead>
        <tr>
          {column.map((item: TableColumnType, index: number) => (
            <TableHeadItem item={item} />
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item: TableRowType, index: number) => (
          <TableRow item={item} column={column} />
        ))}
      </tbody>
    </table>
  );
};

const TableHeadItem = ({ item }: { item: any }) => (
  <th key={item.key}>{item.heading}</th>
);

const TableRow = ({ item, column }: { item: any; column: any }) => (
  <tr>
    {column.map((columnItem: any, index: number) => {
      if (columnItem.value.includes(".")) {
        const itemSplit = columnItem.value.split(".");
        return (
          <td key={item.Key.toString() + index.toString()}>
            {item[itemSplit[0]][itemSplit[1]]}
          </td>
        );
      }
      return (
        <td key={item.Key.toString() + index.toString()}>
          {item[`${columnItem.value}`]}
        </td>
      );
    })}
  </tr>
);

export default Table;
