import React, { useEffect, useState } from 'react';
import { PlusOutlined, DeleteOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons';
import { Button, Form, Input, Table, Typography, Checkbox, InputNumber, message } from 'antd';

type PropertyTanim = {
  isim: string;
  tip: "metin" | "sayi" | "bit";
};

type TipTanim = {
  propertyTanimlar: PropertyTanim[];
};

const formTipTanim: TipTanim = {
  propertyTanimlar: [
    { isim: "İsim", tip: "metin" },
    { isim: "Yaş", tip: "sayi" },
    { isim: "Adres", tip: "metin" },
    { isim: "Aktif", tip: "bit" },
  ],
};

const FormTable: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<any[]>([]);
  const [gecmis, setGecmis] = useState<any[][]>([[]]);
  const [gecmisIndex, setGecmisIndex] = useState(0);
  const [formDegerler, setFormDegerler] = useState<any>({});

  const bosSatirOlustur = () => {
    return formTipTanim.propertyTanimlar.reduce((tipler, ozellik) => {
      tipler[ozellik.isim] = ozellik.tip === "sayi" ? 0 : ozellik.tip === "bit" ? false : "";
      return tipler;
    }, {} as Record<string, any>);
  };

  const tumSatirlariSil = () => {
    setData([]);
    setFormDegerler([]);
  }

  const gecmisKaydet = (yeniData: any[]) => {
    const yeniGecmis = gecmis.slice(0, gecmisIndex + 1);
    yeniGecmis.push(yeniData);
    setGecmis(yeniGecmis);
    setGecmisIndex(yeniGecmis.length - 1);
    setData(yeniData);
    form.setFieldsValue({ items: yeniData });
  };
  
  useEffect(() => {
    const tusDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        geriAl();
      } else if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        ileriAl();
      }
    };

    window.addEventListener('keydown', tusDown);

    return () => {
      window.removeEventListener('keydown', tusDown);
    };
  }, [gecmisIndex, gecmis]);

  const geriAl = () => {
    if (gecmisIndex > 0) {
      setGecmisIndex(gecmisIndex - 1);
      const oncekiData = gecmis[gecmisIndex - 1];
      setData(oncekiData);
      form.setFieldsValue({ items: oncekiData });
    }
  };

  const ileriAl = () => {
    if (gecmisIndex < gecmis.length - 1) {
      setGecmisIndex(gecmisIndex + 1);
      const sonrakiData = gecmis[gecmisIndex + 1];
      setData(sonrakiData);
      form.setFieldsValue({ items: sonrakiData });
    }
  };

  const yapistir = (event: React.ClipboardEvent, bilgiAlanIsmi: string, bilgiAlanIndex: number) => {
    event.preventDefault();
    const panoData = event.clipboardData.getData('Text');
    const satirlar = panoData.split('\n').filter(satir => satir.trim() !== '');
    const ayristirilanSatirlar = satirlar.map(satir => satir.split('\t'));

    const yeniData = [...data];
    const sutunBaslangicIndex = formTipTanim.propertyTanimlar.findIndex(prop => prop.isim === bilgiAlanIsmi);

    ayristirilanSatirlar.forEach((satir, satirIndex) => {
      const dataIndex = bilgiAlanIndex + satirIndex;
      if (!yeniData[dataIndex]) {
        yeniData[dataIndex] = bosSatirOlustur();
      }

      satir.forEach((hucre, hucreIndex) => {
        const ozellikIndex = sutunBaslangicIndex + hucreIndex;
        const ozellik = formTipTanim.propertyTanimlar[ozellikIndex];
        if (ozellik) {
          let deger: string | number | boolean = hucre.trim();
          
          if (ozellik.tip === "sayi") {
            const sayiDeger = Number(deger);
            deger = isNaN(sayiDeger) ? 0 : sayiDeger;
          } else if (ozellik.tip === "bit") {
            deger = deger.toLowerCase() === 'true' || deger === '1';
          }

          yeniData[dataIndex][ozellik.isim] = deger;
        }
      });
    });

    gecmisKaydet(yeniData);
    
    const yeniFormDegerleri = { ...formDegerler, items: yeniData };
    setFormDegerler(yeniFormDegerleri);
    form.setFieldsValue(yeniFormDegerleri);
    
    message.success('Veri başarıyla yapıştırıldı');
  };

  const bilgiAlanDegistir = (index: number, bilgiAlanIsmi: string, deger: any) => {
    const yeniData = [...data];
    if (!yeniData[index]) {
      yeniData[index] = bosSatirOlustur();
    }
    yeniData[index][bilgiAlanIsmi] = deger;
    gecmisKaydet(yeniData);
    const yeniFormDegerleri = { ...formDegerler, items: yeniData };
    setFormDegerler(yeniFormDegerleri);
    form.setFieldsValue(yeniFormDegerleri);
  };

  const sutunlar = formTipTanim.propertyTanimlar.map((ozellik) => ({
    title: ozellik.isim,
    dataIndex: ozellik.isim,
    key: ozellik.isim,
    render: (deger: any, kayit: any, index: number) => (
      <Form.Item
        name={['items', index, ozellik.isim]}
        style={{ margin: 0 }}
        validateStatus={kayit[ozellik.isim] === undefined ? 'error' : ''}
      >
        {ozellik.tip === "metin" && (
          <Input 
            value={deger}
            onChange={(e) => bilgiAlanDegistir(index, ozellik.isim, e.target.value)}
            onPaste={(e) => yapistir(e, ozellik.isim, index)}
            placeholder={`${ozellik.isim} girin`}
          />
        )}
        {ozellik.tip === "sayi" && (
          <InputNumber 
            value={deger}
            onChange={(yeniDeger) => bilgiAlanDegistir(index, ozellik.isim, yeniDeger)}
            style={{ width: '100%' }} 
            onPaste={(e) => yapistir(e, ozellik.isim, index)}
            placeholder={`${ozellik.isim} girin`}
          />
        )}
        {ozellik.tip === "bit" && (
          <Checkbox
            checked={deger}
            onChange={(e) => bilgiAlanDegistir(index, ozellik.isim, e.target.checked)}
          />
        )}
      </Form.Item>
    ),
  }));

  sutunlar.push({
    title: 'İşlem',
    dataIndex: 'islem',
    key: 'action',
    render: (_: any, __: any, index: number) => (
      <DeleteOutlined
        onClick={() => {
          const yeniData = data.filter((_, i) => i !== index);
          setFormDegerler(yeniData)
          gecmisKaydet(yeniData);
          message.success('Satır başarıyla silindi');
        }}
        style={{ color: 'red', cursor: 'pointer' }}
      />
    ),
  });

  const onValuesChange = (_: any, allValues: any) => {
    setFormDegerler(allValues);
  };

  return (
    <Form 
      form={form} 
      initialValues={{ items: [] }}
      onValuesChange={onValuesChange}
    >
      <div style={{ marginBottom: 16 }}>
        <Button
          onClick={geriAl}
          icon={<UndoOutlined />}
          disabled={gecmisIndex <= 0}
        >
          Geri Al (Ctrl+Z)
        </Button>
        <Button
          onClick={ileriAl}
          icon={<RedoOutlined />}
          disabled={gecmisIndex >= gecmis.length - 1}
          style={{ marginLeft: 8 }}
        >
          İleri Al (Ctrl+Y)
        </Button>
        <Button
          onClick={tumSatirlariSil}
          disabled={data.length === 0 && true}
          icon={<DeleteOutlined />}
          style={{ marginLeft: 8 }}
        >
          Tüm Satırları Sil
        </Button>
      </div>
      <Table
        dataSource={data}
        columns={sutunlar}
        pagination={false}
        rowKey={(_, index) => index?.toString() || ''}
      />
      <Form.Item style={{ marginTop: 16 }}>
        <Button
          type="dashed"
          onClick={() => {
            const yeniData = [...data, bosSatirOlustur()];
            gecmisKaydet(yeniData);
            message.success('Yeni satır eklendi');
          }}
          block
          icon={<PlusOutlined />}
        >
          Yeni Satır Ekle
        </Button>
      </Form.Item>
      <Typography.Paragraph>
        <pre>{JSON.stringify(formDegerler, null, 2)}</pre>
      </Typography.Paragraph>
    </Form>
  );
};

export default FormTable;