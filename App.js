import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground, 
  Animated, 
  FlatList, 
  Alert,
  StatusBar,
  Platform,
  Vibration,
  Share,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polygon, Circle } from 'react-native-maps';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// Configurações para o Snack (substitui Dimensions)
const width = 375;
const height = 667;

const COLORS = {
  primary: '#8E44AD',
  secondary: '#E91E63',
  accent: '#FF9800',
  emergency: '#FF3D00',
  success: '#4CAF50',
  warning: '#FFC107',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent'
};


const GRADIENT_COLORS = [COLORS.primary, COLORS.secondary];

// Dados específicos do DF com coordenadas reais
const DF_BOUNDS = {
  latitude: -15.7801,
  longitude: -47.9292,
  latitudeDelta: 0.3,
  longitudeDelta: 0.3,
};

const RISK_ZONES_DF = [
  {
    id: 1,
    name: "Setor Comercial Sul",
    coordinates: [
      { latitude: -15.7942, longitude: -47.8822 },
      { latitude: -15.7942, longitude: -47.8772 },
      { latitude: -15.7992, longitude: -47.8772 },
      { latitude: -15.7992, longitude: -47.8822 },
    ],
    dangerLevel: "Alto",
    incidents: 23,
    description: "Alta concentração de assaltos noturnos"
  },
  {
    id: 2,
    name: "Rodoviária do Plano Piloto",
    coordinates: [
      { latitude: -15.7942, longitude: -47.8822 },
      { latitude: -15.7942, longitude: -47.8772 },
      { latitude: -15.7992, longitude: -47.8772 },
      { latitude: -15.7992, longitude: -47.8822 },
    ],
    dangerLevel: "Médio",
    incidents: 15,
    description: "Movimento suspeito em horários de pico"
  }
];

const EMERGENCY_CONTACTS = [
  { name: "Polícia Militar", number: "190", icon: "shield-outline" },
  { name: "Bombeiros", number: "193", icon: "flame-outline" },
  { name: "SAMU", number: "192", icon: "medical-outline" },
  { name: "Delegacia da Mulher", number: "180", icon: "woman-outline" }
];

const SAFETY_TIPS = [
  "Mantenha sempre contatos de emergência atualizados",
  "Evite locais isolados especialmente à noite",
  "Compartilhe sua localização com pessoas de confiança",
  "Tenha sempre a bateria do celular carregada",
  "Confie em seus instintos - se algo parecer errado, saia do local"
];

// ===================== COMPONENTES REUTILIZÁVEIS =====================
const SeguraButton = ({ title, color, onPress, style, icon, size = 'medium' }) => {
  const getColors = () => {
    switch(color) {
      case 'primary': return [COLORS.accent, '#FF5722'];
      case 'emergency': return ['#FF5252', '#FF1744'];
      case 'success': return [COLORS.success, '#388E3C'];
      default: return [COLORS.secondary, '#AD1457'];
    }
  };

  const buttonSize = size === 'large' ? styles.buttonLarge : 
                   size === 'small' ? styles.buttonSmall : styles.button;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={getColors()}
        style={[buttonSize, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        {icon && <Ionicons name={icon} size={20} color="white" style={{ marginRight: 8 }} />}
        <Text style={[styles.buttonText, size === 'small' && { fontSize: 14 }]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const DeviceStatusCard = ({ isConnected, batteryLevel, heartRate }) => (
  <View style={styles.deviceCard}>
    <View style={styles.deviceHeader}>
      <Ionicons name="watch-outline" size={24} color={COLORS.white} />
      <Text style={styles.deviceTitle}>Pulseira +Segura</Text>
      <View style={[styles.statusDot, { backgroundColor: isConnected ? COLORS.success : COLORS.warning }]} />
    </View>
    
    <View style={styles.deviceMetrics}>
      <View style={styles.metric}>
        <Ionicons name="battery-half-outline" size={20} color={COLORS.white} />
        <Text style={styles.metricText}>Bateria: {Math.round(batteryLevel)}%</Text>
      </View>
      <View style={styles.metric}>
        <Ionicons name="heart-outline" size={20} color={COLORS.white} />
        <Text style={styles.metricText}>Batimentos: {heartRate} bpm</Text>
      </View>
    </View>
  </View>
);

const QuickActionButton = ({ icon, title, onPress, color = COLORS.white }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={[styles.quickActionText, { color }]}>{title}</Text>
  </TouchableOpacity>
);

// ===================== TELAS =====================

// Tela de Início/Splash
const SplashScreen = ({ navigation }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]);

    animation.start(() => {
      setTimeout(() => navigation.navigate('Monitoramento'), 2000);
    });

    return () => animation.stop();
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.container}>
      <StatusBar hidden />
      <Animated.View style={[
        styles.splashContent, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={styles.logoContainer}>
          <Ionicons name="shield-checkmark" size={80} color={COLORS.white} />
          <Text style={styles.splashTitle}>+Segura</Text>
          <Text style={styles.splashSubtitle}>Proteção Inteligente para Mulheres</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingBar, { opacity: fadeAnim }]} />
          <Text style={styles.loadingText}>Sistema Nacional de Proteção à Mulher</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

// Tela Principal de Monitoramento
const MonitoramentoScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [emergencyPressed, setEmergencyPressed] = useState(false);
  const [safetyScore, setSafetyScore] = useState(85);
  const emergencyAnimation = useRef(new Animated.Value(1)).current;

  // Simulação de conexão com pulseira (já que o Snack não suporta Bluetooth real)
  const [isConnected, setIsConnected] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [heartRate, setHeartRate] = useState(72);

 useEffect(() => {
  // Simula dados da pulseira
  const interval = setInterval(() => {
    setHeartRate(prev => Math.max(60, Math.min(120, prev + Math.floor(Math.random() * 10) - 5)));
    setBatteryLevel(prev => Math.max(0, prev - 0.1));
  }, 5000);

  return () => clearInterval(interval);
}, []);
useEffect(() => {
  // Simula detecção de proximidade crítica após 30 segundos
  const timer = setTimeout(() => {
    Alert.alert(
      "⚠️ PROXIMIDADE CRÍTICA",
      "Indivíduo monitorado detectado a 300m",
      [
        { text: "Ver Detalhes", onPress: () => navigation.navigate('ProximidadeCritica') },
        { text: "Ignorar", style: "cancel" }
      ]
    );
  }, 30000);

  return () => clearTimeout(timer);
}, [navigation]);

  useEffect(() => {
    if (emergencyPressed) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(emergencyAnimation, { 
            toValue: 1.2, 
            duration: 500, 
            useNativeDriver: true 
          }),
          Animated.timing(emergencyAnimation, { 
            toValue: 1, 
            duration: 500, 
            useNativeDriver: true 
          })
        ])
      );
      anim.start();

      return () => anim.stop();
    }
  }, [emergencyPressed, emergencyAnimation]);

  const handleEmergencyPress = () => {
    setEmergencyPressed(true);
    Vibration.vibrate([0, 1000, 200, 1000]);
    
    Alert.alert(
      "🚨 ALERTA DE EMERGÊNCIA",
      "Seu alerta será enviado em 5 segundos. Pressione CANCELAR para interromper.",
      [
        { 
          text: "CANCELAR", 
          onPress: () => setEmergencyPressed(false) 
        },
        { 
          text: "ENVIAR AGORA", 
          onPress: () => navigation.navigate('Alerta') 
        }
      ]
    );

    setTimeout(() => {
      if (emergencyPressed) {
        navigation.navigate('Alerta');
      }
    }, 5000);
  };

  const shareLocation = async () => {
    try {
      await Share.share({
        message: `Estou aqui: https://maps.google.com/?q=${-15.7942},${-47.8822}`,
        title: 'Minha localização - +Segura'
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://i.imgur.com/8Km9tLL.jpg' }} 
      style={styles.backgroundImage}>
      <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientOverlay}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        <View style={styles.container}>
          {/* Header com Score de Segurança */}
          <View style={styles.headerContainer}>
            <View style={styles.headerLogo}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.white} />
              <Text style={styles.headerLogoText}>+Segura</Text>
            </View>
            <View style={styles.safetyScore}>
              <Text style={styles.safetyScoreText}>Score: {safetyScore}</Text>
              <View style={[styles.safetyScoreBar, { backgroundColor: safetyScore > 70 ? COLORS.success : COLORS.warning }]} />
            </View>
          </View>

          {/* Status da Pulseira */}
          <DeviceStatusCard 
            isConnected={isConnected}
            batteryLevel={batteryLevel}
            heartRate={heartRate}
          />

          {/* Mapa Principal */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Monitoramento Ativo</Text>
              <TouchableOpacity onPress={shareLocation}>
                <Ionicons name="share-outline" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              {Platform.OS === 'web' ? (
                <View style={styles.fakeMap}>
                  <Ionicons name="location-outline" size={48} color={COLORS.white} />
                  <Text style={styles.fakeMapText}>Mapa não suportado nesta plataforma</Text>
                </View>
              ) : (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    ...DF_BOUNDS,
                    latitude: -15.7942,
                    longitude: -47.8822,
                  }}
                  showsUserLocation={true}>
                  
                  <Marker
                    coordinate={{
                      latitude: -15.7942,
                      longitude: -47.8822
                    }}
                    title="Sua Localização"
                    description="Você está neste local"
                  />
                  
                  <Circle
                    center={{
                      latitude: -15.7942,
                      longitude: -47.8822
                    }}
                    radius={200}
                    strokeColor={COLORS.success}
                    fillColor="rgba(76, 175, 80, 0.1)"
                    strokeWidth={2}
                  />
                  
                  {RISK_ZONES_DF.map(zone => (
                    <Polygon
                      key={zone.id}
                      coordinates={zone.coordinates}
                      strokeColor={zone.dangerLevel === "Alto" ? COLORS.emergency : COLORS.warning}
                      fillColor={zone.dangerLevel === "Alto" ? "rgba(255,61,0,0.3)" : "rgba(255,193,7,0.3)"}
                      strokeWidth={2}
                    />
                  ))}
                </MapView>
              )}
            </View>

            {/* Botão de Emergência */}
            <Animated.View style={{ transform: [{ scale: emergencyAnimation }] }}>
              <TouchableOpacity
                style={[styles.emergencyButton, emergencyPressed && styles.emergencyButtonActive]}
                onPress={handleEmergencyPress}
                activeOpacity={0.8}>
                <Ionicons name="warning" size={24} color={COLORS.white} />
                <Text style={styles.emergencyButtonText}>
                  {emergencyPressed ? "CANCELAR ALERTA" : "SOS EMERGÊNCIA"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Ações Rápidas */}
          <View style={styles.quickActionsContainer}>
           <QuickActionButton
              icon="person-outline"
              title="Perfil"
              onPress={() => navigation.navigate('PerfilRisco')}
            />
            <QuickActionButton
              icon="map-outline"
              title="Zonas de Risco"
              onPress={() => navigation.navigate('ZonasRisco')}
            />
            <QuickActionButton
              icon="time-outline"
              title="Histórico"
              onPress={() => navigation.navigate('Historico')}
            />
            <QuickActionButton
              icon="call-outline"
              title="Contatos"
              onPress={() => navigation.navigate('Contatos')}
            />
            <QuickActionButton
              icon="settings-outline"
              title="Ajustes"
              onPress={() => navigation.navigate('Configuracoes')}
            />
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

// Tela de Zonas de Risco
const ZonasRiscoScreen = ({ navigation }) => {
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <ImageBackground 
      source={{ uri: 'https://i.imgur.com/8Km9tLL.jpg' }} 
      style={styles.backgroundImage}>
      <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientOverlay}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.container}>
          {/* Header com botão de voltar */}
          <View style={styles.headerWithBack}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Zonas de Risco - DF</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mapa de Segurança</Text>
            <Text style={styles.cardSubtitle}>
              Áreas com histórico de incidentes no Distrito Federal
            </Text>
            
            <View style={styles.mapContainer}>
              {Platform.OS === 'web' ? (
                <View style={styles.fakeMap}>
                  <Ionicons name="map-outline" size={48} color={COLORS.white} />
                  <Text style={styles.fakeMapText}>Mapa não suportado nesta plataforma</Text>
                </View>
              ) : (
                <MapView
                  style={styles.map}
                  initialRegion={DF_BOUNDS}
                  showsUserLocation={true}>
                  
                  {RISK_ZONES_DF.map(zone => (
                    <Polygon
                      key={zone.id}
                      coordinates={zone.coordinates}
                      strokeColor={zone.dangerLevel === "Alto" ? COLORS.emergency : COLORS.warning}
                      fillColor={zone.dangerLevel === "Alto" ? "rgba(255,61,0,0.4)" : "rgba(255,193,7,0.4)"}
                      strokeWidth={2}
                      onPress={() => setSelectedZone(zone)}
                    />
                  ))}
                </MapView>
              )}
            </View>
            
            {/* Legenda */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: 'rgba(255,61,0,0.6)' }]} />
                <Text style={styles.legendText}>Alto Risco ({RISK_ZONES_DF.filter(z => z.dangerLevel === "Alto").length} zonas)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: 'rgba(255,193,7,0.6)' }]} />
                <Text style={styles.legendText}>Risco Moderado ({RISK_ZONES_DF.filter(z => z.dangerLevel === "Médio").length} zonas)</Text>
              </View>
            </View>
          </View>

          {/* Lista de Zonas */}
          <View style={[styles.card, { maxHeight: 200 }]}>
            <Text style={styles.cardTitle}>Detalhes das Zonas</Text>
            <FlatList
              data={RISK_ZONES_DF}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.zoneItem, selectedZone?.id === item.id && styles.zoneItemSelected]}
                  onPress={() => setSelectedZone(item)}>
                  <View style={styles.zoneItemHeader}>
                    <Text style={styles.zoneItemName}>{item.name}</Text>
                    <View style={[
                      styles.dangerBadge,
                      { backgroundColor: item.dangerLevel === "Alto" ? COLORS.emergency : COLORS.warning }
                    ]}>
                      <Text style={styles.dangerBadgeText}>{item.dangerLevel}</Text>
                    </View>
                  </View>
                  <Text style={styles.zoneItemDescription}>{item.description}</Text>
                  <Text style={styles.zoneItemIncidents}>{item.incidents} incidentes registrados</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

// Tela de Contatos de Emergência
const ContatosScreen = ({ navigation }) => {
  const callEmergency = (number) => {
    Alert.alert(
      `Ligação para ${number}`,
      "Você será redirecionado para o aplicativo de telefone",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Ligar", onPress: () => console.log("Ligando para:", number) }
      ]
    );
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://i.imgur.com/8Km9tLL.jpg' }} 
      style={styles.backgroundImage}>
      <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientOverlay}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.container}>
          <View style={styles.headerWithBack}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contatos de Emergência</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ligação Rápida</Text>
            <Text style={styles.cardSubtitle}>Acesso direto aos serviços de emergência</Text>
            
            {EMERGENCY_CONTACTS.map((contact, index) => (
              <TouchableOpacity
                key={index}
                style={styles.emergencyContactItem}
                onPress={() => callEmergency(contact.number)}>
                <View style={styles.emergencyContactLeft}>
                  <Ionicons name={contact.icon} size={24} color={COLORS.white} />
                  <View style={styles.emergencyContactText}>
                    <Text style={styles.emergencyContactName}>{contact.name}</Text>
                    <Text style={styles.emergencyContactNumber}>{contact.number}</Text>
                  </View>
                </View>
                <Ionicons name="call" size={24} color={COLORS.success} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dicas de Segurança</Text>
            {SAFETY_TIPS.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

// Tela de Configurações
const ConfiguracoesScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [autoAlert, setAutoAlert] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);

  return (
    <ImageBackground 
      source={{ uri: 'https://i.imgur.com/8Km9tLL.jpg' }} 
      style={styles.backgroundImage}>
      <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientOverlay}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.container}>
          <View style={styles.headerWithBack}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Configurações</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Preferências de Segurança</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
                <Text style={styles.settingText}>Notificações</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, notifications && styles.toggleActive]}
                onPress={() => setNotifications(!notifications)}>
                <View style={[styles.toggleButton, notifications && styles.toggleButtonActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="alert-circle-outline" size={24} color={COLORS.white} />
                <Text style={styles.settingText}>Alerta Automático</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, autoAlert && styles.toggleActive]}
                onPress={() => setAutoAlert(!autoAlert)}>
                <View style={[styles.toggleButton, autoAlert && styles.toggleButtonActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="location-outline" size={24} color={COLORS.white} />
                <Text style={styles.settingText}>Compartilhar Localização</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, shareLocation && styles.toggleActive]}
                onPress={() => setShareLocation(!shareLocation)}>
                <View style={[styles.toggleButton, shareLocation && styles.toggleButtonActive]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sobre o App</Text>
            <Text style={styles.aboutText}>
              +Segura v2.0{'\n'}
              Desenvolvido para o Hackathon de Segurança Pública{'\n'}
              Conecte sua pulseira inteligente para máxima proteção
            </Text>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

// Tela de Histórico
const HistoricoScreen = ({ navigation }) => {
  const alertHistory = [
    { 
      id: 1, 
      type: 'Alerta manual', 
      date: '15/06/2025 14:30', 
      location: 'Asa Sul, Quadra 702',
      status: 'Resolvido',
      icon: 'hand-left-outline'
    },
    { 
      id: 2, 
      type: 'Batimentos alterados', 
      date: '14/06/2025 22:15', 
      location: 'Setor Comercial Sul',
      status: 'Verificado',
      icon: 'heart-outline'
    },
    { 
      id: 3, 
      type: 'Zona de risco', 
      date: '12/06/2025 18:40', 
      location: 'Rodoviária do Plano Piloto',
      status: 'Monitorado',
      icon: 'location-outline'
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Resolvido': return COLORS.success;
      case 'Verificado': return COLORS.warning;
      case 'Monitorado': return COLORS.secondary;
      default: return COLORS.white;
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://i.imgur.com/8Km9tLL.jpg' }} 
      style={styles.backgroundImage}>
      <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientOverlay}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.container}>
          <View style={styles.headerWithBack}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Histórico de Alertas</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Últimos 30 dias</Text>
            <Text style={styles.cardSubtitle}>
              {alertHistory.length} eventos registrados
            </Text>
            
            <FlatList
              data={alertHistory}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <Ionicons name={item.icon} size={24} color={COLORS.white} />
                    <View style={styles.historyItemText}>
                      <Text style={styles.historyItemType}>{item.type}</Text>
                      <Text style={styles.historyItemDate}>{item.date}</Text>
                      <Text style={styles.historyItemLocation}>{item.location}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                  </View>
                </View>
              )}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estatísticas do Mês</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Alertas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Zonas Evitadas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>98%</Text>
                <Text style={styles.statLabel}>Uptime</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

// Tela de Alerta de Emergência
const AlertaScreen = ({ navigation }) => {
  const [countdown, setCountdown] = useState(30);
  const [alertSent, setAlertSent] = useState(false);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animação de pulso
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnimation, { toValue: 1, duration: 500, useNativeDriver: true })
      ])
    );
    pulseAnim.start();

    // Countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setAlertSent(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      pulseAnim.stop();
      clearInterval(timer);
    };
  }, [pulseAnimation]);

  const cancelAlert = () => {
    Alert.alert(
      "Cancelar Alerta",
      "Tem certeza que deseja cancelar o alerta de emergência?",
      [
        { text: "Não", style: "cancel" },
        { text: "Sim", onPress: () => navigation.navigate('Monitoramento') }
      ]
    );
  };

  return (
    <LinearGradient colors={['#FF3D00', '#FF5722']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF3D00" />
      
      <View style={styles.alertContainer}>
        <Animated.View style={[
          styles.alertIconContainer, 
          { transform: [{ scale: pulseAnimation }] }
        ]}>
          <Ionicons name="warning" size={80} color={COLORS.white} />
        </Animated.View>
        
        <Text style={styles.alertTitle}>
          {alertSent ? "ALERTA ENVIADO!" : "ENVIANDO ALERTA"}
        </Text>
        
        {!alertSent ? (
          <>
            <Text style={styles.alertCountdown}>{countdown}</Text>
            <Text style={styles.alertDescription}>
              Alertando seus contatos de emergência em {countdown} segundos
            </Text>
            
            <SeguraButton
              title="CANCELAR ALERTA"
              color="primary"
              onPress={cancelAlert}
              style={styles.cancelButton}
            />
          </>
        ) : (
          <>
            <Text style={styles.alertDescription}>
              Seus contatos foram notificados com sua localização atual
            </Text>
            
            <View style={styles.alertActions}>
              <SeguraButton
                title="LIGAR PARA A POLÍCIA"
                color="emergency"
                onPress={() => console.log("Ligando para 190")}
                icon="call"
              />
              
              <SeguraButton
                title="CANCELAR FALSO ALARME"
                color="primary"
                onPress={() => navigation.navigate('Monitoramento')}
                style={{ marginTop: 10 }}
              />
            </View>
          </>
        )}
      </View>
    </LinearGradient>
  );
};

// ===================== NAVEGAÇÃO =====================
const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Inicio"
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Inicio" component={SplashScreen} />
        <Stack.Screen name="Monitoramento" component={MonitoramentoScreen} />
        <Stack.Screen name="ZonasRisco" component={ZonasRiscoScreen} />
        <Stack.Screen name="Contatos" component={ContatosScreen} />
        <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
        <Stack.Screen name="Historico" component={HistoricoScreen} />
        <Stack.Screen name="Alerta" component={AlertaScreen} />
        <Stack.Screen name="PerfilRisco" component={PerfilRiscoScreen} />
        <Stack.Screen name="ProximidadeCritica" component={ProximidadeCriticaScreen} />
        <Stack.Screen name="ModoProtecao" component={ModoProtecaoScreen} />
        <Stack.Screen name="PlanoFuga" component={PlanoFugaScreen} />
        <Stack.Screen name="FeedbackAlerta" component={FeedbackAlertaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
const PerfilRiscoScreen = ({ navigation }) => {
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [hasProtectiveOrder, setHasProtectiveOrder] = useState(false);

  const riskOptions = [
    { id: 1, title: "Com medida protetiva ativa", description: "Possuo medida protetiva judicial" },
    { id: 2, title: "Ameaças recebidas", description: "Recebo ameaças frequentemente" },
    { id: 3, title: "Perseguição/Stalking", description: "Estou sendo perseguida/vigiada" },
    { id: 4, title: "Prevenção geral", description: "Quero monitoramento preventivo" }
  ];

  return (
    <ImageBackground source={{ uri: 'https://i.imgur.com/8Km9tLL.jpg' }} style={styles.backgroundImage}>
      <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientOverlay}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.container}>
          <View style={styles.headerWithBack}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Perfil de Proteção</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuração Inicial</Text>
            <Text style={styles.cardSubtitle}>
              Personalize sua proteção de acordo com sua situação
            </Text>
            
            {riskOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.riskOption, selectedRisk === option.id && styles.riskOptionSelected]}
                onPress={() => setSelectedRisk(option.id)}>
                <View style={styles.riskOptionLeft}>
                  <Ionicons 
                    name={selectedRisk === option.id ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={COLORS.white} 
                  />
                  <View style={styles.riskOptionText}>
                    <Text style={styles.riskOptionTitle}>{option.title}</Text>
                    <Text style={styles.riskOptionDescription}>{option.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <SeguraButton
            title="ATIVAR PROTEÇÃO PERSONALIZADA"
            color="primary"
            onPress={() => navigation.navigate('Monitoramento')}
            style={{ marginTop: 20 }}
            icon="shield-checkmark"
          />
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const ModoProtecaoScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient colors={['#FF3D00', '#FF5722']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.alertContainer}>
        <Ionicons name="shield-checkmark" size={80} color={COLORS.white} />
        
        <Text style={styles.alertTitle}>MODO PROTEÇÃO ATIVA</Text>
        <Text style={styles.protectionSubtitle}>Você está sendo protegida</Text>
        
        <View style={styles.protectionStatus}>
          <View style={styles.protectionItem}>
            <Ionicons name="mic" size={20} color={COLORS.white} />
            <Text style={styles.protectionText}>Gravando áudio: {formatTime(recordingTime)}</Text>
          </View>
          
          <View style={styles.protectionItem}>
            <Ionicons name="location" size={20} color={COLORS.white} />
            <Text style={styles.protectionText}>Localização compartilhada</Text>
          </View>
          
          <View style={styles.protectionItem}>
            <Ionicons name="people" size={20} color={COLORS.white} />
            <Text style={styles.protectionText}>Contatos alertados</Text>
          </View>
          
          <View style={styles.protectionItem}>
            <Ionicons name="call" size={20} color={COLORS.white} />
            <Text style={styles.protectionText}>PM notificada</Text>
          </View>
        </View>

        <SeguraButton
          title="ENCERRAR PROTEÇÃO"
          color="primary"
          onPress={() => navigation.navigate('FeedbackAlerta')}
          style={{ marginTop: 30 }}
        />
      </View>
    </LinearGradient>
  );
};

const PlanoFugaScreen = ({ navigation }) => {
  const [planActive, setPlanActive] = useState(false);

  const emergencyPlan = [
    { step: 1, action: "Sair pela porta dos fundos", icon: "exit-outline" },
    { step: 2, action: "Seguir para a Farmácia ABC (200m)", icon: "storefront-outline" },
    { step: 3, action: "Pedir ajuda ao funcionário", icon: "people-outline" },
    { step: 4, action: "Aguardar chegada da PM", icon: "shield-outline" }
  ];

  return (
    <ImageBackground source={{ uri: 'https://i.imgur.com/8Km9tLL.jpg' }} style={styles.backgroundImage}>
      <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientOverlay}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.container}>
          <View style={styles.headerWithBack}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Plano de Fuga</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rota de Segurança</Text>
            <Text style={styles.cardSubtitle}>
              Seu caminho mais seguro para um local protegido
            </Text>
            
            {emergencyPlan.map((item) => (
              <View key={item.step} style={styles.planStep}>
                <Text style={styles.planStepNumber}>{item.step}</Text>
                <Ionicons name={item.icon} size={24} color={COLORS.white} />
                <Text style={styles.planStepText}>{item.action}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Local Seguro Mais Próximo</Text>
            <View style={styles.safeLocation}>
              <Ionicons name="location" size={24} color={COLORS.success} />
              <View style={styles.safeLocationText}>
                <Text style={styles.safeLocationName}>Farmácia ABC - 24h</Text>
                <Text style={styles.safeLocationDistance}>200 metros • 2 min caminhando</Text>
              </View>
            </View>
          </View>

          <SeguraButton
            title={planActive ? "PLANO ATIVADO - SEGUIR ROTA" : "ATIVAR PLANO DE FUGA"}
            color={planActive ? "success" : "emergency"}
            onPress={() => setPlanActive(!planActive)}
            icon={planActive ? "checkmark-circle" : "exit"}
          />
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const FeedbackAlertaScreen = ({ navigation }) => {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [observation, setObservation] = useState('');

  const feedbackOptions = [
    { id: 1, title: "Estou segura agora", icon: "checkmark-circle", color: COLORS.success },
    { id: 2, title: "Ainda preciso de ajuda", icon: "warning", color: COLORS.emergency },
    { id: 3, title: "Falso alarme", icon: "close-circle", color: COLORS.warning }
  ];

  return (
    <ImageBackground source={{ uri: 'https://i.imgur.com/8Km9tLL.jpg' }} style={styles.backgroundImage}>
      <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientOverlay}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.container}>
          <View style={styles.headerWithBack}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Como você está?</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Avaliação de Segurança</Text>
            <Text style={styles.cardSubtitle}>
              Nos ajude a entender sua situação atual
            </Text>
            
            {feedbackOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.feedbackOption, selectedFeedback === option.id && styles.feedbackOptionSelected]}
                onPress={() => setSelectedFeedback(option.id)}>
                <Ionicons name={option.icon} size={24} color={option.color} />
                <Text style={styles.feedbackOptionText}>{option.title}</Text>
                <Ionicons 
                  name={selectedFeedback === option.id ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={COLORS.white} 
                />
              </TouchableOpacity>
            ))}
          </View>

          {selectedFeedback && (
            <SeguraButton
              title="CONFIRMAR STATUS"
              color="primary"
              onPress={() => navigation.navigate('Monitoramento')}
              icon="checkmark"
            />
          )}
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const ProximidadeCriticaScreen = ({ navigation }) => {
  const [distance, setDistance] = useState(230);
  const [isApproaching, setIsApproaching] = useState(true);

  useEffect(() => {
    // Simula mudança de distância
    const interval = setInterval(() => {
      setDistance(prev => {
        const newDistance = prev + (Math.random() * 50 - 25);
        setIsApproaching(newDistance < prev);
        return Math.max(50, Math.min(500, newDistance));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ImageBackground source={{ uri: 'https://i.imgur.com/8Km9tLL.jpg' }} style={styles.backgroundImage}>
      <LinearGradient colors={['#FF3D00', '#FF5722']} style={styles.gradientOverlay}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.container}>
          <View style={styles.headerWithBack}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Proximidade Crítica</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.alertContainer}>
            <Ionicons name="warning" size={80} color={COLORS.white} />
            
            <Text style={styles.alertTitle}>
              {isApproaching ? "APROXIMAÇÃO DETECTADA" : "DISTÂNCIA SEGURA"}
            </Text>
            
            <Text style={styles.proximityDistance}>{Math.round(distance)}m</Text>
            <Text style={styles.alertDescription}>
              Indivíduo monitorado está a {Math.round(distance)} metros
            </Text>

            <View style={styles.proximityActions}>
              <SeguraButton
                title="ATIVAR ALERTA AUTOMÁTICO"
                color="emergency"
                onPress={() => navigation.navigate('ModoProtecao')}
                icon="shield-outline"
              />
              
              <SeguraButton
                title="VER PLANO DE FUGA"
                color="primary"
                onPress={() => navigation.navigate('PlanoFuga')}
                style={{ marginTop: 10 }}
                icon="exit-outline"
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

// ===================== ESTILOS =====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  
  // Splash Screen
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 20,
    textAlign: 'center',
  },
  splashSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.9,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: COLORS.white,
    borderRadius: 2,
    marginBottom: 15,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  safetyScore: {
    alignItems: 'flex-end',
  },
  safetyScoreText: {
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 4,
  },
  safetyScoreBar: {
    height: 4,
    width: 100,
    borderRadius: 2,
  },

  // Device Status Card
  deviceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deviceTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deviceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    color: COLORS.white,
    marginLeft: 8,
    fontSize: 14,
  },

  // Cards
  card: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: COLORS.white,
    opacity: 0.8,
    fontSize: 14,
    marginBottom: 15,
  },

  // Map
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  fakeMap: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
  },
  fakeMapText: {
    color: COLORS.white,
    marginTop: 10,
  },

  // Emergency Button
  emergencyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.emergency,
    paddingVertical: 15,
    borderRadius: 10,
  },
  emergencyButtonActive: {
    backgroundColor: '#D32F2F',
  },
  emergencyButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAction: {
    alignItems: 'center',
    width: width * 0.2,
  },
  quickActionText: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },

  // Buttons
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  buttonLarge: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Header with Back Button
  headerWithBack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },

  // Legend
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 5,
  },
  legendText: {
    color: COLORS.white,
    fontSize: 12,
  },

  // Zone Items
  zoneItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  zoneItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  zoneItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  zoneItemName: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  dangerBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  dangerBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  zoneItemDescription: {
    color: COLORS.white,
    opacity: 0.8,
    fontSize: 12,
    marginBottom: 3,
  },
  zoneItemIncidents: {
    color: COLORS.white,
    fontSize: 11,
    opacity: 0.6,
  },

  // Emergency Contacts
  emergencyContactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  emergencyContactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyContactText: {
    marginLeft: 15,
  },
  emergencyContactName: {
    color: COLORS.white,
    fontWeight: '600',
  },
  emergencyContactNumber: {
    color: COLORS.white,
    opacity: 0.7,
    fontSize: 12,
  },

  // Tips
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tipText: {
    color: COLORS.white,
    marginLeft: 8,
    fontSize: 14,
  },

  // Settings
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    color: COLORS.white,
    marginLeft: 15,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.success,
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleButtonActive: {
    alignSelf: 'flex-end',
  },

  // About
  aboutText: {
    color: COLORS.white,
    opacity: 0.8,
    lineHeight: 22,
    marginTop: 5,
  },

  // History
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemText: {
    marginLeft: 15,
  },
  historyItemType: {
    color: COLORS.white,
    fontWeight: '600',
  },
  historyItemDate: {
    color: COLORS.white,
    opacity: 0.7,
    fontSize: 12,
    marginTop: 2,
  },
  historyItemLocation: {
    color: COLORS.white,
    opacity: 0.7,
    fontSize: 12,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.white,
    opacity: 0.8,
    fontSize: 12,
    marginTop: 5,
  },

  // Alert Screen
  alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  alertIconContainer: {
    marginBottom: 30,
  },
  alertTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  alertCountdown: {
    color: COLORS.white,
    fontSize: 72,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  alertDescription: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  cancelButton: {
    width: '100%',
  },
  alertActions: {
    width: '100%',
  },
  // Perfil de Risco
riskOption: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 15,
  paddingHorizontal: 10,
  borderRadius: 8,
  marginBottom: 10,
},
riskOptionSelected: {
  backgroundColor: 'rgba(255,255,255,0.1)',
},
riskOptionLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
riskOptionText: {
  marginLeft: 15,
  flex: 1,
},
riskOptionTitle: {
  color: COLORS.white,
  fontWeight: '600',
  fontSize: 16,
},
riskOptionDescription: {
  color: COLORS.white,
  opacity: 0.8,
  fontSize: 14,
  marginTop: 2,
},

// Proximidade
proximityDistance: {
  color: COLORS.white,
  fontSize: 48,
  fontWeight: 'bold',
  marginVertical: 20,
},
proximityActions: {
  width: '100%',
  marginTop: 30,
},

// Modo Proteção
protectionSubtitle: {
  color: COLORS.white,
  fontSize: 18,
  opacity: 0.9,
  marginBottom: 30,
  textAlign: 'center',
},
protectionStatus: {
  width: '100%',
  marginVertical: 20,
},
protectionItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
  paddingHorizontal: 15,
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderRadius: 8,
  marginBottom: 10,
},
protectionText: {
  color: COLORS.white,
  marginLeft: 10,
  fontSize: 16,
},

// Plano de Fuga
planStep: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 10,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255,255,255,0.1)',
},
planStepNumber: {
  color: COLORS.white,
  fontSize: 18,
  fontWeight: 'bold',
  width: 30,
  textAlign: 'center',
},
planStepText: {
  color: COLORS.white,
  marginLeft: 15,
  fontSize: 16,
  flex: 1,
},
safeLocation: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
},
safeLocationText: {
  marginLeft: 15,
},
safeLocationName: {
  color: COLORS.white,
  fontWeight: '600',
  fontSize: 16,
},
safeLocationDistance: {
  color: COLORS.white,
  opacity: 0.8,
  fontSize: 14,
},

// Feedback
feedbackOption: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 15,
  paddingHorizontal: 10,
  borderRadius: 8,
  marginBottom: 10,
},
feedbackOptionSelected: {
  backgroundColor: 'rgba(255,255,255,0.1)',
},
feedbackOptionText: {
  color: COLORS.white,
  fontSize: 16,
  marginLeft: 15,
  flex: 1,
},

});

export default App;