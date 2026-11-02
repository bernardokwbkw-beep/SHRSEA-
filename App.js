import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Linking, Alert, StyleSheet, Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DEFAULTS, PRESETS } from './src/config';
import { findServers, validatePlace, joinUrl, joinWebUrl } from './src/robloxApi';
import { loadVisited, saveVisited, loadSettings, saveSettings } from './src/storage';

export default function App() {
  const [placeId, setPlaceId] = useState(DEFAULTS.placeId);
  const [minPlayers, setMinPlayers] = useState(String(DEFAULTS.minPlayers));
  const [maxPlayers, setMaxPlayers] = useState(String(DEFAULTS.maxPlayers));
  const [servers, setServers] = useState([]);
  const [visited, setVisited] = useState([]);
  const [gameName, setGameName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Toque em "Buscar servidores".');

  useEffect(() => {
    (async () => {
      setVisited(await loadVisited());
      const s = await loadSettings();
      if (s) {
        setPlaceId(s.placeId ?? DEFAULTS.placeId);
        setMinPlayers(String(s.minPlayers ?? DEFAULTS.minPlayers));
        setMaxPlayers(String(s.maxPlayers ?? DEFAULTS.maxPlayers));
      }
    })();
  }, []);

  const parsed = () => {
    const min = Math.max(0, parseInt(minPlayers, 10) || 0);
    const max = Math.max(min, parseInt(maxPlayers, 10) || min);
    return { min, max, id: placeId.trim() };
  };

  const validate = async () => {
    const { id } = parsed();
    if (!/^\d+$/.test(id)) return Alert.alert('Place ID inválido', 'Use apenas números.');
    setLoading(true);
    try {
      const info = await validatePlace(id);
      setGameName(info.name);
      setStatus(`Jogo: ${info.name} (${info.playing} jogando agora)`);
    } catch (e) {
      setGameName(null);
      Alert.alert('Não foi possível validar', e.message);
    } finally {
      setLoading(false);
    }
  };

  const search = useCallback(async () => {
    const { min, max, id } = parsed();
    if (!/^\d+$/.test(id)) return Alert.alert('Place ID inválido', 'Use apenas números.');
    await saveSettings({ placeId: id, minPlayers: min, maxPlayers: max });
    setLoading(true);
    setServers([]);
    try {
      const list = await findServers(id, {
        minPlayers: min,
        maxPlayers: max,
        onProgress: (p, n) => setStatus(`Página ${p}... ${n} servidor(es) na faixa`),
      });
      setServers(list);
      setStatus(list.length ? `${list.length} servidor(es) com ${min}–${max} jogador(es).` : 'Nenhum servidor nessa faixa agora. Tente de novo ou aumente o máximo.');
    } catch (e) {
      setStatus('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [placeId, minPlayers, maxPlayers]);

  const join = async (server) => {
    const { id } = parsed();
    const next = [...visited, server.id];
    setVisited(next);
    saveVisited(next);
    try {
      await Linking.openURL(joinUrl(id, server.id));
    } catch {
      try {
        await Linking.openURL(joinWebUrl(id, server.id));
      } catch {
        Alert.alert('Não consegui abrir o Roblox', 'Confirme se o app do Roblox está instalado.');
      }
    }
  };

  const hopNext = () => {
    const candidate = servers.find((s) => !visited.includes(s.id));
    if (!candidate) return Alert.alert('Sem servidores novos', 'Todos já foram visitados. Busque de novo.');
    join(candidate);
  };

  const clearVisited = () => { setVisited([]); saveVisited([]); };

  const renderItem = ({ item }) => {
    const seen = visited.includes(item.id);
    return (
      <View style={[styles.card, seen && styles.cardSeen]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.playing}/{item.maxPlayers} jogadores</Text>
          <Text style={styles.cardSub}>
            ping {item.ping ?? '?'} ms · fps {item.fps ? Math.round(item.fps) : '?'}{seen ? ' · já visitado' : ''}
          </Text>
          <Text style={styles.cardId} numberOfLines={1}>{item.id}</Text>
        </View>
        <TouchableOpacity style={styles.joinBtn} onPress={() => join(item)}>
          <Text style={styles.joinTxt}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <Text style={styles.title}>Egg Hopper</Text>

      <Text style={styles.label}>Place ID</Text>
      <TextInput style={styles.input} value={placeId} onChangeText={setPlaceId} keyboardType="number-pad" />
      <View style={styles.row}>
        {PRESETS.map((p) => (
          <TouchableOpacity key={p.placeId} style={styles.chip} onPress={() => { setPlaceId(p.placeId); setGameName(null); }}>
            <Text style={styles.chipTxt}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {gameName && <Text style={styles.ok}>✔ {gameName}</Text>}

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Mín. jogadores</Text>
          <TextInput style={styles.input} value={minPlayers} onChangeText={setMinPlayers} keyboardType="number-pad" />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Máx. jogadores</Text>
          <TextInput style={styles.input} value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="number-pad" />
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={search} disabled={loading}>
          <Text style={styles.btnTxt}>Buscar servidores</Text>
        </TouchableOpacity>
        <View style={{ width: 8 }} />
        <TouchableOpacity style={[styles.btnAlt]} onPress={validate} disabled={loading}>
          <Text style={styles.btnTxt}>Validar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btnHop, { flex: 1 }]} onPress={hopNext} disabled={loading || !servers.length}>
          <Text style={styles.btnTxt}>Próximo servidor ▶</Text>
        </TouchableOpacity>
        <View style={{ width: 8 }} />
        <TouchableOpacity style={styles.btnAlt} onPress={clearVisited}>
          <Text style={styles.btnTxt}>Limpar histórico ({visited.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
        <Text style={styles.status}>{status}</Text>
      </View>

      <FlatList data={servers} keyExtractor={(s) => s.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 40 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#12141a', padding: 16, paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) + 8 : 8 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 8 },
  label: { color: '#9aa3b2', fontSize: 12, marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#1d212b', color: '#fff', borderRadius: 8, padding: 10, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 8 },
  chip: { backgroundColor: '#262b38', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 4 },
  chipTxt: { color: '#c7cedc', fontSize: 11 },
  ok: { color: '#5fd38d', marginTop: 4 },
  btn: { backgroundColor: '#3b6cf6', borderRadius: 8, padding: 12, alignItems: 'center' },
  btnAlt: { backgroundColor: '#2c3242', borderRadius: 8, padding: 12, alignItems: 'center' },
  btnHop: { backgroundColor: '#1f9d62', borderRadius: 8, padding: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  status: { color: '#c7cedc', flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1d212b', borderRadius: 10, padding: 12, marginBottom: 8 },
  cardSeen: { opacity: 0.45 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cardSub: { color: '#9aa3b2', fontSize: 12, marginTop: 2 },
  cardId: { color: '#5b6478', fontSize: 10, marginTop: 2 },
  joinBtn: { backgroundColor: '#3b6cf6', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  joinTxt: { color: '#fff', fontWeight: '700' },
});
