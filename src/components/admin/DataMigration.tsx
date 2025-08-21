import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, AlertTriangle, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function DataMigration() {
  const [infoShown, setInfoShown] = useState(false);
  const { toast } = useToast();

  const showInfo = () => {
    setInfoShown(true);
    toast({
      title: 'Bilgi',
      description: 'Uygulama tamamen Supabase ile entegre edilmiştir.',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <Card className="gradient-card shadow-trading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="h-5 w-5" />
            Veri Yönetimi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Uygulama tamamen Supabase veritabanı ile entegre edilmiştir.
              Tüm veriler Supabase'de güvenle saklanmaktadır.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4">
            <Card className="gradient-card border-info/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-info">Supabase Entegrasyonu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-profit">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Aktif</span>
                  </div>
                  <div className="text-sm text-white/80">
                    Tüm hesaplar ve işlemler Supabase'de saklanmaktadır.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button
              variant="trading-primary"
              onClick={showInfo}
              disabled={infoShown}
              className="min-w-[200px]"
            >
              <Database className="h-4 w-4 mr-2" />
              Bilgi Al
            </Button>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted/20 border border-border/30">
            <h3 className="text-sm font-medium text-white mb-2">Supabase Avantajları:</h3>
            <ol className="text-sm text-white/80 space-y-1 list-decimal list-inside">
              <li>Verileriniz bulut ortamında güvenle saklanır</li>
              <li>Farklı cihazlardan aynı hesaplara erişebilirsiniz</li>
              <li>Veri kaybı riski ortadan kalkar</li>
              <li>Performans ve güvenlik artışı sağlar</li>
              <li>Gerçek zamanlı veri senkronizasyonu</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
