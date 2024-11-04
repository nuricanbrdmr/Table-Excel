import React, { useState, useEffect, useRef } from "react";
import { Table } from "antd";
import type { ColumnType } from "antd/es/table";
import { TableRowSelection } from "antd/es/table/interface";

interface DataTuru {
  key: React.Key;
  isim: string;
  yas: number;
  cinsiyet: string;
  dtarih: string;
  adres: string;
  aktif: boolean;
}

interface HucreKordinatlari {
  satir: number;
  sutun: number;
}

const sutunlar: ColumnType<DataTuru>[] = [
  { title: "İsim", dataIndex: "isim", key: "isim", width: "20%" },
  { title: "Yaş", dataIndex: "yas", key: "yas", width: "10%" },
  { title: "Cinsiyet", dataIndex: "cinsiyet", key: "cinsiyet", width: "15%" },
  { title: "Doğum Tarihi", dataIndex: "dtarih", key: "dtarih", width: "15%" },
  { title: "Adres", dataIndex: "adres", key: "adres", width: "25%" },
  {
    title: "Aktif",
    dataIndex: "aktif",
    key: "aktif",
    width: "10%",
    render: (value: boolean) => value.toString(),
  },
];

const tumData: DataTuru[] = Array.from({ length: 50 }, (_, i) => ({
  key: i,
  isim: `Nuri Can Birdemir ${i + 1}`,
  yas: 11 + i,
  cinsiyet: i % 2 ? "Erkek" : "Kadın",
  dtarih: "16.06.2003",
  adres: `Hadımköy, Baykar Özdemir Bayraktar Merkezi . ${i + 1}`,
  aktif: i % 2 ? true : false,
}));

const TabloExcel: React.FC = () => {
  const [secilenHucreler, setSecilenHucreler] = useState<HucreKordinatlari[]>([]);
  const [aktifHucre, setAktifHucre] = useState<HucreKordinatlari>({ satir: 0, sutun: 0 });
  const [baslangicHucresi, setBaslangicHucresi] = useState<HucreKordinatlari>({ satir: 0, sutun: 0 });
  const [seciliyorMu, setSeciliyorMu] = useState(false);
  const [seciliSatirlar, setSeciliSatirlar] = useState<DataTuru[]>([]);
  const [tableData, setTableData] = useState<DataTuru[]>(tumData.slice(0, 10));
  const [yuklenenVeriSayisi, setYuklenenVeriSayisi] = useState(10);

  const tuslar = useRef({ ctrl: false, shift: false }).current;
  let tumDataYuklendi = useRef<boolean>(false).current;
  let yukleniyor = useRef<boolean>(false).current;

  // Scroll ile 10'arlı şekilde data yükleme
  useEffect(() => {
    const tableBody = document.querySelector('.ant-table-body');
    const handleScroll = () => {
      if (yukleniyor || tumDataYuklendi) return;
  
      if (!tableBody) return;
  
      const { scrollTop, scrollHeight, clientHeight } = tableBody;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 20;
  
      if (isAtBottom) {
        yukleniyor = true;
        
        setTimeout(() => {
          const newCount = yuklenenVeriSayisi + 10;
          setTableData(tumData.slice(0, newCount));
          setYuklenenVeriSayisi(newCount);
          yukleniyor = false;
          tumDataYuklendi = newCount >= tumData.length; 
        }, 500);
      }
    };
  
    tableBody?.addEventListener('scroll', handleScroll);
    return () => tableBody?.removeEventListener('scroll', handleScroll);
  }, [yukleniyor, yuklenenVeriSayisi, tumData]);
  
  // Key ve Mouse Event kontrolleri
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) tuslar.ctrl = true;
      if (event.shiftKey) tuslar.shift = true;
      if (event.ctrlKey && event.key === "c") kopyala();
      okTusKullanimi(event);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.ctrlKey) tuslar.ctrl = false;
      if (!event.shiftKey) tuslar.shift = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [secilenHucreler, seciliSatirlar, aktifHucre]);

  const okTusKullanimi = (event: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const { satir, sutun } = aktifHucre;
      let yeniSatir = satir;
      let yeniSutun = sutun;

      switch (event.key) {
        case "ArrowUp":
          yeniSatir = Math.max(0, satir - 1);
          break;
        case "ArrowDown":
          yeniSatir = Math.min(tableData.length - 1, satir + 1);
          break;
        case "ArrowLeft":
          yeniSutun = Math.max(0, sutun - 1);
          break;
        case "ArrowRight":
          yeniSutun = Math.min(sutunlar.length - 1, sutun + 1);
          break;
      }

      const yeniAktifHucre = { satir: yeniSatir, sutun: yeniSutun };
      setAktifHucre(yeniAktifHucre);

      if (tuslar.shift) {
        aralikSecimiYap(baslangicHucresi, yeniAktifHucre);
      } else {
        setBaslangicHucresi(yeniAktifHucre);
        setSecilenHucreler([yeniAktifHucre]);
      }

      hucreyeKaydir(yeniSatir, yeniSutun);
    }
  };

  const hucreyeKaydir = (satir: number, sutun: number) => {
    const tableBody = document.querySelector('.ant-table-body');
    if (!tableBody) return;
  
    const rowElement = tableBody.querySelector(`tr:nth-child(${satir + 2})`);
    const cellElement = rowElement?.querySelector(`td:nth-child(${sutun + 2})`);
  
    if (cellElement) {
      cellElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  };
  
  const hucreMouseDown = (satirIndis: number, sutunIndis: number) => {
    const yeniKoordinat = { satir: satirIndis, sutun: sutunIndis };
    
    if (tuslar.ctrl) {
      setSeciliyorMu(true);
      setBaslangicHucresi(yeniKoordinat);
      if (secilenHucreler. some(hucre => hucre.satir === yeniKoordinat.satir && hucre.sutun === yeniKoordinat.sutun)) {
        setSecilenHucreler(oncekiHucreler => 
          oncekiHucreler.filter(hucre => !(hucre.satir === yeniKoordinat.satir && hucre.sutun === yeniKoordinat.sutun))
        );
      } else {
        setSecilenHucreler(oncekiHucreler => [...oncekiHucreler, yeniKoordinat]);
      }
    } else if (tuslar.shift) {
      aralikSecimiYap(baslangicHucresi, yeniKoordinat);
    } else {
      setSecilenHucreler([yeniKoordinat]);
      setSeciliyorMu(true);
      setBaslangicHucresi(yeniKoordinat);
      setAktifHucre(yeniKoordinat);
    }
  };

  const hucreMouseOver = (satirIndis: number, sutunIndis: number) => {
    if (seciliyorMu) {
      const mevcutKoordinat = { satir: satirIndis, sutun: sutunIndis };
      aralikSecimiYap(baslangicHucresi, mevcutKoordinat);
    }
  };

  const aralikSecimiYap = (baslangic: HucreKordinatlari, bitis: HucreKordinatlari) => {
      const minSatir = Math.min(baslangic.satir, bitis.satir);
      const maxSatir = Math.max(baslangic.satir, bitis.satir);
      const minSutun = Math.min(baslangic.sutun, bitis.sutun);
      const maxSutun = Math.max(baslangic.sutun, bitis.sutun);
  
      const filtrelenmisSecim = secilenHucreler. filter(hucre => 
        !(hucre.satir >= minSatir && hucre.satir <= maxSatir && 
          hucre.sutun >= minSutun && hucre.sutun <= maxSutun)
      );
  
      const yeniSecim: HucreKordinatlari[] = [];
      for (let satir = minSatir; satir <= maxSatir; satir++) {
        for (let sutun = minSutun; sutun <= maxSutun; sutun++) {
          yeniSecim.push({ satir, sutun });
        }
      }
  
      tuslar.ctrl ? setSecilenHucreler([...filtrelenmisSecim, ...yeniSecim]) : setSecilenHucreler(yeniSecim);;
  };

  const kopyala = () => {
    const tumSecimler = [
      ...secilenHucreler,
      ...seciliSatirlar.flatMap((satir) =>
        sutunlar.map((_, sutunIndis) => ({
          satir: tableData.indexOf(satir),
          sutun: sutunIndis,
        }))
      ),
    ];   

    if (tumSecimler.length === 0) return;

    // Hücreleri sırala ve tekrar edenleri kaldır
    const filtrelenmisSecim = tumSecimler
    .filter((hucre, indis, secimDizisi) => 
      indis === secimDizisi.findIndex(h => h.satir === hucre.satir && h.sutun === hucre.sutun)
    )
    .sort((a, b) => a.satir === b.satir ? a.sutun - b.sutun : a.satir - b.satir);
  
    const minSatir = Math.min(...filtrelenmisSecim.map(hucre => hucre.satir));
    const minSutun = Math.min(...filtrelenmisSecim.map(hucre => hucre.sutun));

    const matris: string[][] = [];
    
    filtrelenmisSecim.forEach(({ satir, sutun }) => {
      if (!matris[satir - minSatir]) matris[satir - minSatir] = [];
      const veri = tableData[satir]?.[sutunlar[sutun].dataIndex as keyof DataTuru];
      matris[satir - minSatir][sutun - minSutun] = String(veri ?? '');
    });

    const kopyalananVeri = matris
      .map(satir => satir.join('\t'))
      .join('\n');

    navigator.clipboard.writeText(kopyalananVeri)
      .then(() => {
        tuslar.ctrl = false;
        alert("Veriler kopyalandı!");
      });
  };

  const satirSecimi: TableRowSelection<DataTuru> = {
    onChange: (_: any, seciliSatirlar: DataTuru[]) => {
      setSeciliSatirlar(seciliSatirlar);
    },
  };  

  const tabloSutunlari = sutunlar.map((sutun, sutunIndis) => ({
    ...sutun,
    onCell: (veri: DataTuru, satirIndis?: number) => ({
      onMouseDown: () => hucreMouseDown(satirIndis!, sutunIndis),
      onMouseOver: () => hucreMouseOver(satirIndis!, sutunIndis),
      onMouseUp: () => setSeciliyorMu(false),
      style: {
        backgroundColor: secilenHucreler. some(selected => selected.satir === satirIndis && selected.sutun === sutunIndis)
          ? "lightblue"
          : undefined,
        cursor: "pointer",
        outline: "none",
        border:
          aktifHucre.satir === satirIndis && aktifHucre.sutun === sutunIndis
            ? "1px solid #2d9594"
            : undefined,
      },
    }),
  }));

  return (
    <div tabIndex={0}>
      <Table<DataTuru>
        columns={tabloSutunlari}
        rowSelection={satirSecimi}
        dataSource={tableData}
        bordered
        loading={yukleniyor}
        pagination={false}
        scroll={{ y: 500 }}
        style={{ userSelect: "none" }}
      />
    </div>
  );
};

export default TabloExcel;