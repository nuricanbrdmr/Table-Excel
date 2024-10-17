import React, { useState, useEffect } from 'react';
import { Table, Button, Input, message } from 'antd';
import { PlusOutlined, DeleteOutlined, UndoOutlined } from '@ant-design/icons';

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
  const [history, setHistory] = useState<DataType[][]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  const saveToHistory = (newData: DataType[]) => {
    setHistory(prev => [...prev, data]);
    setData(newData);
  };

  const handleSave = (row: DataType) => {
    const newData = data.map(item => (item.key === row.key ? { ...item, ...row } : item));
    saveToHistory(newData);
  };

  const handleDelete = (key: string) => {
    const newData = data.filter(item => item.key !== key);
    saveToHistory(newData);
  };

  const handleAdd = () => {
    const newRow: DataType = { key: Date.now().toString(), name: '', age: '', address: '', number: '' };
    saveToHistory([...data, newRow]);
  };

  const handleClear = () => {
    saveToHistory([]);
    message.success('Tüm veriler temizlendi!');
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').split('\n').filter(row => row);
    if (!pastedData.length || !selectedCells.length) return;
  
    let newData = [...data];
    const { rowKey, columnIndex: startCol } = selectedCells[0];
    let startRow = newData.findIndex(item => item.key === rowKey);
  
    while (newData.length < startRow + pastedData.length) {
      const newRow: DataType = { 
        key: Date.now().toString() + Math.random(), 
        name: '', 
        age: '', 
        address: '', 
        number: '' 
      };
      newData.push(newRow);
    }
  
    pastedData.forEach((row, i) => {
      row.split('\t').forEach((cell, j) => {
        const rowIndex = startRow + i;
        const colIndex = startCol + j;
        if (colIndex < columns.length - 1) {
          const field = columns[colIndex].dataIndex as keyof DataType;
          if (field && typeof newData[rowIndex][field] === 'string') {
            newData[rowIndex][field] = cell.trim();
          }
        }
      });
    });
  
    saveToHistory(newData);
    message.success('Veri başarıyla yapıştırıldı!');
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setData(lastState);
      setHistory(prev => prev.slice(0, -1));
      message.info('Son işlem geri alındı');
    } else {
      message.warning('Geri alınacak işlem kalmadı');
    }
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
      <Button onClick={handleClear} type="default" style={{ marginBottom: 16, marginRight: 8 }} icon={<DeleteOutlined />}>
        Tüm Verileri Temizle
      </Button>
      <Button onClick={handleUndo} type="default" style={{ marginBottom: 16 }} icon={<UndoOutlined />}>
        Geri Al
      </Button>
      <Table bordered dataSource={data} columns={columns} pagination={false} />
    </div>
  );
}