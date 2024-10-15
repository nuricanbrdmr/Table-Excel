import React, { useState } from 'react';
import { Table, Button, Input, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

interface DataType {
  key: string;
  name: string;
  age: string;
  address: string;
  number: string;
}

interface CellPosition {
  rowKey: string;
  columnIndex: number;
}

export default function EditableTableForm() {
  const [data, setData] = useState<DataType[]>([]);
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);

  const handleSave = (row: DataType) => {
    setData(data.map(item => (item.key === row.key ? { ...item, ...row } : item)));
  };

  const handleDelete = (key: string) => {
    setData(prevData => prevData.filter(item => item.key !== key));
  };

  const handleAdd = () => {
    const newRow: DataType = { key: Date.now().toString(), name: '', age: '', address: '', number: '' };
    setData(prevData => [...prevData, newRow]);
  };

  const handleClear = () => {
    setData([]); // Tüm veriyi temizle
    message.success('Tüm veriler temizlendi!');
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').split('\n').filter(row => row);
    if (!pastedData.length || !selectedCells.length) return;
  
    const newData = [...data];
    const { rowKey, columnIndex: startCol } = selectedCells[0];
    const startRow = newData.findIndex(item => item.key === rowKey);
  
    pastedData.forEach((row, i) => {
      row.split('\t').forEach((cell, j) => {
        const rowIndex = startRow + i;
        const colIndex = startCol + j;
        if (rowIndex < newData.length && colIndex < columns.length) {
          const field = columns[colIndex].dataIndex as keyof DataType;
          if (field && typeof newData[rowIndex][field] === 'string') {
            newData[rowIndex][field] = cell.trim();
          }
        }
      });
    });
  
    setData(newData);
    message.success('Veri başarıyla yapıştırıldı!');
  };
  

  const handleCellClick = (rowKey: string, columnIndex: number, e: React.MouseEvent) => {
    setSelectedCells(e.ctrlKey || e.metaKey ? [...selectedCells, { rowKey, columnIndex }] : [{ rowKey, columnIndex }]);
  };

  const columns = [
    { title: 'İsim', dataIndex: 'name', render: (text: string, record: DataType) => renderCell(text, record, 0) },
    { title: 'Yaş', dataIndex: 'age', render: (text: string, record: DataType) => renderCell(text, record, 1) },
    { title: 'Adres', dataIndex: 'address', render: (text: string, record: DataType) => renderCell(text, record, 2) },
    { title: 'Numara', dataIndex: 'number', render: (text: string, record: DataType) => renderCell(text, record, 3) },
    {
      title: 'İşlemler',
      dataIndex: 'operation',
      render: (_: any, record: DataType) => (
        <Button onClick={() => handleDelete(record.key)} type="link" danger icon={<DeleteOutlined />} />
      ),
    },
  ];

  const renderCell = (text: string, record: DataType, columnIndex: number) => (
    <Input
      value={text}
      onChange={e => handleSave({ ...record, [columns[columnIndex].dataIndex]: e.target.value })}
      onClick={e => handleCellClick(record.key, columnIndex, e)}
    />
  );

  return (
    <div onPaste={handlePaste} tabIndex={0}>
      <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16, marginRight: 8 }} icon={<PlusOutlined />}>
        Yeni Satır Ekle
      </Button>
      <Button onClick={handleClear} type="default" style={{ marginBottom: 16 }}>
        Tüm Verileri Temizle
      </Button>
      <Table bordered dataSource={data} columns={columns} pagination={false} />
    </div>
  );
}
