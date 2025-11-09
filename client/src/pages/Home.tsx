import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Calculator, Rocket, Flame } from "lucide-react";

interface MotorRequirements {
  thrust: number;
  burnTime: number;
  totalImpulse: number;
  propellantMass: number;
  motorMass: number;
  thrustToWeight: number;
}

export default function Home() {
  const [apogee, setApogee] = useState<string>("");
  const [avgThrust, setAvgThrust] = useState<string>("");
  const [rocketMass, setRocketMass] = useState<string>("1.5");
  const [diameter, setDiameter] = useState<string>("76.2");
  const [dragCoeff, setDragCoeff] = useState<string>("0.75");
  const [results, setResults] = useState<MotorRequirements | null>(null);
  const [warning, setWarning] = useState<string>("");

  // Constantes
  const g = 9.8; // m/s²
  const rho = 1.2; // kg/m³ (densidade do ar)

  const calculateFromApogee = () => {
    const h = parseFloat(apogee);
    const M = parseFloat(rocketMass);
    const D = parseFloat(diameter) / 1000; // converter mm para m
    const Cd = parseFloat(dragCoeff);
    
    if (isNaN(h) || isNaN(M) || isNaN(D) || isNaN(Cd)) {
      return;
    }
    
    const A = Math.PI * (D / 2) ** 2;
    const k = 0.5 * rho * Cd * A;

    // Estimativa de impulso necessário usando aproximação
    const I_estimate = M * Math.sqrt(2 * g * h * (1 + (k * h) / M));
    
    // Tempo de queima típico (assumindo 2-3 segundos)
    const t_burn = 2.5;
    const F_avg = I_estimate / t_burn;

    // Massa de propelente (assumindo Isp ~100s para motores amadores)
    const Isp = 100;
    const m_prop = I_estimate / (Isp * g);

    // Massa total do motor (propelente + case ~30% da massa do propelente)
    const m_motor = m_prop * 1.3;

    // Razão empuxo/peso
    const tw_ratio = F_avg / ((M + m_motor) * g);

    // Verificar limites teóricos
    let warningMsg = "";
    if (m_prop / m_motor > 0.9) {
      warningMsg = "ALERTA: Razão massa propelente/motor muito alta (>90%). Motor seria estruturalmente fraco.";
    } else if (tw_ratio < 1.2) {
      warningMsg = "ALERTA: Razão empuxo/peso muito baixa (<1.2). Foguete pode não decolar adequadamente.";
    } else if (m_motor / M > 0.8) {
      warningMsg = "ALERTA: Motor muito pesado em relação ao foguete (>80% da massa). Considere reduzir o apogeu alvo.";
    }

    setWarning(warningMsg);
    setResults({
      thrust: F_avg,
      burnTime: t_burn,
      totalImpulse: I_estimate,
      propellantMass: m_prop,
      motorMass: m_motor,
      thrustToWeight: tw_ratio,
    });
  };

  const calculateFromThrust = () => {
    const F_avg = parseFloat(avgThrust);
    const M = parseFloat(rocketMass);
    const D = parseFloat(diameter) / 1000;
    const Cd = parseFloat(dragCoeff);
    
    if (isNaN(F_avg) || isNaN(M) || isNaN(D) || isNaN(Cd)) {
      return;
    }
    
    const A = Math.PI * (D / 2) ** 2;
    const k = 0.5 * rho * Cd * A;

    // Tempo de queima típico
    const t_burn = 2.5;
    const I = F_avg * t_burn;

    // Massa de propelente
    const Isp = 100;
    const m_prop = I / (Isp * g);
    const m_motor = m_prop * 1.3;

    // Razão empuxo/peso
    const tw_ratio = F_avg / ((M + m_motor) * g);

    // Verificar limites
    let warningMsg = "";
    if (m_prop / m_motor > 0.9) {
      warningMsg = "ALERTA: Razão massa propelente/motor muito alta (>90%). Motor seria estruturalmente fraco.";
    } else if (tw_ratio < 1.2) {
      warningMsg = "ALERTA: Razão empuxo/peso muito baixa (<1.2). Foguete pode não decolar adequadamente.";
    } else if (F_avg > 500) {
      warningMsg = "AVISO: Empuxo muito alto para motores amadores típicos. Verifique requisitos estruturais.";
    }

    setWarning(warningMsg);
    setResults({
      thrust: F_avg,
      burnTime: t_burn,
      totalImpulse: I,
      propellantMass: m_prop,
      motorMass: m_motor,
      thrustToWeight: tw_ratio,
    });
  };

  return (
    <div className="container py-12 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-primary rounded-xl">
              <Calculator className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Predição de Requisitos de Motor Sólido
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Determine os requisitos do motor com base no apogeu desejado ou empuxo médio necessário
          </p>
        </div>

        <Tabs defaultValue="apogee" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="apogee" className="text-base">
              <Rocket className="w-4 h-4 mr-2" />
              Por Apogeu Desejado
            </TabsTrigger>
            <TabsTrigger value="thrust" className="text-base">
              <Flame className="w-4 h-4 mr-2" />
              Por Empuxo Médio
            </TabsTrigger>
          </TabsList>

          {/* Tab: Cálculo por Apogeu */}
          <TabsContent value="apogee" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Calcular Requisitos a partir do Apogeu</CardTitle>
                <CardDescription className="text-base">
                  Insira o apogeu desejado e os parâmetros do foguete para calcular os requisitos do motor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="apogee" className="text-base font-semibold">Apogeu Desejado (m)</Label>
                    <Input
                      id="apogee"
                      type="number"
                      placeholder="1000"
                      value={apogee}
                      onChange={(e) => setApogee(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mass-apogee" className="text-base font-semibold">Massa do Foguete (kg)</Label>
                    <Input
                      id="mass-apogee"
                      type="number"
                      step="0.1"
                      placeholder="1.5"
                      value={rocketMass}
                      onChange={(e) => setRocketMass(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diameter-apogee" className="text-base font-semibold">Diâmetro do Foguete (mm)</Label>
                    <Input
                      id="diameter-apogee"
                      type="number"
                      step="0.1"
                      placeholder="76.2"
                      value={diameter}
                      onChange={(e) => setDiameter(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cd-apogee" className="text-base font-semibold">Coeficiente de Arrasto (Cd)</Label>
                    <Input
                      id="cd-apogee"
                      type="number"
                      step="0.01"
                      placeholder="0.75"
                      value={dragCoeff}
                      onChange={(e) => setDragCoeff(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                </div>
                <Button onClick={calculateFromApogee} className="w-full h-12 text-base" size="lg">
                  <Rocket className="w-5 h-5 mr-2" />
                  Calcular Requisitos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Cálculo por Empuxo */}
          <TabsContent value="thrust" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Calcular Requisitos a partir do Empuxo Médio</CardTitle>
                <CardDescription className="text-base">
                  Insira o empuxo médio desejado e os parâmetros do foguete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="thrust" className="text-base font-semibold">Empuxo Médio Desejado (N)</Label>
                    <Input
                      id="thrust"
                      type="number"
                      placeholder="100"
                      value={avgThrust}
                      onChange={(e) => setAvgThrust(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mass-thrust" className="text-base font-semibold">Massa do Foguete (kg)</Label>
                    <Input
                      id="mass-thrust"
                      type="number"
                      step="0.1"
                      placeholder="1.5"
                      value={rocketMass}
                      onChange={(e) => setRocketMass(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diameter-thrust" className="text-base font-semibold">Diâmetro do Foguete (mm)</Label>
                    <Input
                      id="diameter-thrust"
                      type="number"
                      step="0.1"
                      placeholder="76.2"
                      value={diameter}
                      onChange={(e) => setDiameter(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cd-thrust" className="text-base font-semibold">Coeficiente de Arrasto (Cd)</Label>
                    <Input
                      id="cd-thrust"
                      type="number"
                      step="0.01"
                      placeholder="0.75"
                      value={dragCoeff}
                      onChange={(e) => setDragCoeff(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                </div>
                <Button onClick={calculateFromThrust} className="w-full h-12 text-base" size="lg">
                  <Flame className="w-5 h-5 mr-2" />
                  Calcular Requisitos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resultados */}
        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {warning && (
              <Alert variant="destructive" className="border-2">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="text-lg font-bold">Limite Teórico Atingido</AlertTitle>
                <AlertDescription className="text-base">{warning}</AlertDescription>
              </Alert>
            )}

            <Card className="border-2 border-primary shadow-xl">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl">Requisitos Calculados do Motor</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-6 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl border-2 border-accent/30">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Empuxo Médio</p>
                    <p className="text-4xl font-bold text-accent">{results.thrust.toFixed(1)}</p>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Newtons</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border-2 border-primary/30">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Impulso Total</p>
                    <p className="text-4xl font-bold text-primary">{results.totalImpulse.toFixed(1)}</p>
                    <p className="text-sm font-medium text-muted-foreground mt-1">N·s</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-chart-3/20 to-chart-3/5 rounded-xl border-2 border-chart-3/30">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tempo de Queima</p>
                    <p className="text-4xl font-bold text-chart-3">{results.burnTime.toFixed(1)}</p>
                    <p className="text-sm font-medium text-muted-foreground mt-1">segundos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Massa de Propelente</p>
                    <p className="text-2xl font-bold">{(results.propellantMass * 1000).toFixed(0)} g</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Massa Total do Motor</p>
                    <p className="text-2xl font-bold">{(results.motorMass * 1000).toFixed(0)} g</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Razão Empuxo/Peso</p>
                    <p className="text-2xl font-bold">{results.thrustToWeight.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-6 p-5 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border-l-4 border-primary">
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Recomendações Técnicas
                  </h4>
                  <ul className="space-y-2 text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>Pressão de câmara recomendada: <strong>5-7 MPa</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>Propelente sugerido: <strong>KNSB ou KNDX</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>Razão de expansão da tubeira: <strong>4-8</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>Fator de segurança estrutural mínimo: <strong>2.0</strong></span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
