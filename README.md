
# Tablo Excel Projesi

Bu proje, Ant Design kütüphanesini kullanarak bir tablo oluşturur. Kullanıcılar, tablodaki hücreleri seçebilir, sayfalama özelliklerinden yararlanabilir ve seçili verileri yerel depolama (localStorage) ile kaydedebilir. Proje, kullanıcıların büyük veri setleriyle etkileşimde bulunmasını kolaylaştırmak için geliştirilmiştir.

## Özellikler

- **Hücre Seçimi**: Kullanıcılar, hücreleri tıklayarak seçebilir ve seçilen hücreleri görüntüleyebilir.
- **Sayfalama**: Tablo, sayfalama özelliği ile verileri daha yönetilebilir bir şekilde gösterir.
- **Yerel Depolama**: Seçilen hücreler ve satırlar, tarayıcı yerel depolamasında saklanır ve sayfa yenilense bile korunur.
- **Dinamik Veri**: Tablodaki veriler, dinamik olarak güncellenir ve kullanıcı etkileşimlerine yanıt verir.

## Gereksinimler

- Node.js (v12 veya daha yeni)
- React (v16.8 veya daha yeni)
- Ant Design

## Kurulum

Projenizi yerel makinenizde çalıştırmak için şu adımları izleyin:

1. Bu repoyu klonlayın:
   ```bash
   git clone https://github.com/nuricanbrdmr/Table-Excel.git
   ```

2. Proje dizinine gidin:
   ```bash
   cd Table-Excel
   ```

3. Gerekli bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

4. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

Tarayıcınızda `http://localhost:5173` adresine giderek uygulamayı görüntüleyebilirsiniz.

## Kullanım

Tablonun üstündeki sütun başlıklarına tıklayarak tüm hücreleri seçebilir veya satırları tek tek seçebilirsiniz. Sayfa boyutunu değiştirerek görüntülenen veri sayısını ayarlayabilirsiniz. Seçili veriler, yerel depolama sayesinde sayfa yenilense bile kaydedilecektir.
