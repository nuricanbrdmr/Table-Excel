import React, { useState, useEffect } from "react";
import { Button, Form, Input, Table, Typography, Checkbox, InputNumber, message, Select, DatePicker } from "antd";
import { PlusOutlined, DeleteOutlined, UndoOutlined, RedoOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

type PropertyTanim = {
    isim: string;
    tip: "metin" | "sayi" | "bit" | "secim" | "tarih";
    secenekler?: string[];
  };
  
  type TipTanim = {
    propertyTanimlar: PropertyTanim[];
  };
  
  const formTipTanim: TipTanim = {
    propertyTanimlar: [
      { isim: "İsim", tip: "metin" },
      { isim: "Yaş", tip: "sayi" },
      { 
        isim: "Cinsiyet", 
        tip: "secim",
        secenekler: ["Kadın", "Erkek"]
      },
      { isim: "Doğum Tarihi", tip: "tarih" },
      { isim: "Adres", tip: "metin" },
      { isim: "Aktif", tip: "bit" },
    ],
  };

export default function FormTable() {
  const [form] = Form.useForm();
  const [data, setData] = useState<any[]>([]);
  const [gecmis, setGecmis] = useState<any[][]>([[]]);
  const [gecmisIndex, setGecmisIndex] = useState(0);
  const [formDegerler, setFormDegerler] = useState<any>({});

  const gecmisKaydet = (yeniData: any[]) => {
    const yeniGecmis = gecmis.slice(0, gecmisIndex + 1);
    yeniGecmis.push(yeniData);
    setGecmis(yeniGecmis);
    setGecmisIndex(yeniGecmis.length - 1);
    setData(yeniData);
    setFormDegerler(yeniData);
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
    window.addEventListener("keydown", tusDown);
    return () => window.removeEventListener("keydown", tusDown);
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

  const yapistir = async (event: React.ClipboardEvent, bilgiAlanIsmi: string, bilgiAlanIndex: number) => {
    event.preventDefault();
    const panoData = event.clipboardData.getData("Text");
    const satirlar = panoData.split("\n").filter((satir) => satir.trim() !== "");
    const ayristirilanSatirlar = satirlar.map((satir) => satir.split("\t"));

    const yeniData = [...data];
    const sutunBaslangicIndex = formTipTanim.propertyTanimlar.findIndex((prop) => prop.isim === bilgiAlanIsmi);

    ayristirilanSatirlar.forEach((satir, satirIndex) => {
      const dataIndex = bilgiAlanIndex + satirIndex;
      if (!yeniData[dataIndex]) {
        yeniData[dataIndex] = {};
      }

      satir.forEach((hucre, hucreIndex) => {
        const ozellikIndex = sutunBaslangicIndex + hucreIndex;
        const ozellik = formTipTanim.propertyTanimlar[ozellikIndex];
        if (ozellik) {
          let deger: any = hucre.trim();

          switch (ozellik.tip) {
            case "sayi":
              deger = Number(deger) || 0;
              break;
            case "bit":
              deger = deger.toLowerCase() === "true" || deger === "1";
              break;

            case "tarih":
                  const tarihFormatlari = ["DD.MM.YYYY", "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"];
                  for (const format of tarihFormatlari) {
                    const tarih = dayjs(deger, format, true);
                    if (tarih.isValid()) {
                      deger = tarih;
                      break;
                    }
                  }
                break;

            case "secim":
              deger = ozellik.secenekler?.find((secim) => secim.toLowerCase() === deger.toLowerCase()) || ozellik.secenekler?.[0];
              break;
          }

          yeniData[dataIndex][ozellik.isim] = deger;
        }
      });
    });

    gecmisKaydet(yeniData);
    message.success("Veri başarıyla yapıştırıldı");
  };

  const bilgiAlanDegistir = (index: number, bilgiAlanIsmi: string, deger: any) => {
    const yeniData = [...data];
    if (!yeniData[index]) {
      yeniData[index] = {};
    }
    yeniData[index][bilgiAlanIsmi] = deger;
    gecmisKaydet(yeniData);
  };

  const sutunlar = formTipTanim.propertyTanimlar.map((ozellik) => ({
    title: ozellik.isim,
    dataIndex: ozellik.isim,
    key: ozellik.isim,
    render: (deger: any, _: any, index: number) => (
      <Form.Item name={["items", index, ozellik.isim]} style={{ margin: 0 }}>
        {ozellik.tip === "tarih" ? (
          <div
            onPaste={(e) => yapistir(e, ozellik.isim, index)}
            style={{ width: "100%" }}
            tabIndex={0} // Div'in fokuslanabilir olmasını sağlar
          >
            <DatePicker
              value={deger ? dayjs(deger) : null}
              style={{ width: "100%" }}
              onChange={(tarih) => bilgiAlanDegistir(index, ozellik.isim, tarih)}
            />
          </div>
        ) : ozellik.tip === "metin" ? (
          <Input
            value={deger}
            onChange={(e) => bilgiAlanDegistir(index, ozellik.isim, e.target.value)}
            onPaste={(e) => yapistir(e, ozellik.isim, index)}
          />
        ) : ozellik.tip === "sayi" ? (
          <InputNumber
            value={deger}
            onChange={(newValue) => bilgiAlanDegistir(index, ozellik.isim, newValue)}
            style={{ width: "100%" }}
            onPaste={(e) => yapistir(e, ozellik.isim, index)}
          />
        ) : ozellik.tip === "bit" ? (
          <Checkbox
            checked={deger}
            onChange={(e) => bilgiAlanDegistir(index, ozellik.isim, e.target.checked)}
          />
        ) : ozellik.tip === "secim" ? (
          <Select
            value={deger}
            style={{ width: "100%" }}
            onChange={(deger) => bilgiAlanDegistir(index, ozellik.isim, deger)}
          >
            {ozellik.secenekler?.map((secenek) => (
              <Select.Option key={secenek} value={secenek}>
                {secenek}
              </Select.Option>
            ))}
          </Select>
        ) : null}
      </Form.Item>
    ),
  }));

  sutunlar.push({
    title: "İşlem",
    dataIndex: "islem",
    key: "action",
    render: (_: any, __: any, index: number) => (
      <DeleteOutlined
        onClick={() => {
          const yeniData = data.filter((_, i) => i !== index);
          gecmisKaydet(yeniData);
          setFormDegerler({ items: yeniData });
          message.success("Satır başarıyla silindi");
        }}
        style={{ color: "red", cursor: "pointer" }}
      />
    ),
  });

  return (
    <Form form={form} initialValues={{ items: [] }}>
      <div style={{ marginBottom: 16 }}>
        <Button onClick={geriAl} icon={<UndoOutlined />} disabled={gecmisIndex <= 0}>
          Geri Al (Ctrl+Z)
        </Button>
        <Button onClick={ileriAl} icon={<RedoOutlined />} disabled={gecmisIndex >= history.length - 1} style={{ marginLeft: 8 }}>
          İleri Al (Ctrl+Y)
        </Button>
        <Button onClick={() => {gecmisKaydet([]); setFormDegerler({ items: [] });}} disabled={data.length === 0} icon={<DeleteOutlined />} style={{ marginLeft: 8 }}>
          Tüm Satırları Sil
        </Button>
      </div>
      <Table
        dataSource={data}
        columns={sutunlar}
        pagination={false}
        rowKey={(_, index) => index?.toString() || ""}
      />
      <Form.Item style={{ marginTop: 16 }}>
        <Button
          type="dashed"
          onClick={() => {
            const yeniData = [...data, {}];
            gecmisKaydet(yeniData);
            message.success("Yeni satır eklendi");
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
}