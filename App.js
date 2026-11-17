import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, TextInput, Alert, StatusBar, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_REQ = (lvl) => lvl * 100;
const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 10;

const FORMS = [
  { lv: 1, name: 'Base Fighter', icon: '🟠', aura: '#ff6b00', mult: 1.0 },
  { lv: 2, name: 'Phantom Shift', icon: '👻', aura: '#22c55e', mult: 1.2 },
  { lv: 3, name: 'Super Saiyan', icon: '💛', aura: '#facc15', mult: 1.5 },
  { lv: 4, name: 'Hero of Ooo', icon: '🗡️', aura: '#10b981', mult: 1.8 },
  { lv: 5, name: 'Super Saiyan Blue', icon: '💙', aura: '#38bdf8', mult: 2.2 },
  { lv: 6, name: 'Ultra Instinct', icon: '🤍', aura: '#e2e8f0', mult: 3.0 },
];

const AURA_THEMES = {
  flame:   { name: '🔥 Saiyan Flame', bg: '#05050a', card: '#120d1d', border: '#ff6b00', accent: '#ff6b00' },
  abyssal: { name: '🌊 Abyssal Gold', bg: '#030b14', card: '#091e32', border: '#facc15', accent: '#eab308' },
  emerald: { name: '🌿 Emerald Realm', bg: '#03100a', card: '#07291c', border: '#10b981', accent: '#10b981' },
  phantom: { name: '👻 Phantom Neon', bg: '#040d07', card: '#0a1f12', border: '#22c55e', accent: '#22c55e' },
  berry:   { name: '⚡ Hyper Berry', bg: '#0d0417', card: '#1e0b36', border: '#ec4899', accent: '#d946ef' },
};

const CAPSULE_SHOP = [
  { id: 'senzu', name: 'Korin Senzu Bean', cost: 120, icon: '🟢', desc: 'Protects your habit streaks & restores stamina' },
  { id: 'slushie', name: 'Brain-Freeze Slushie', cost: 150, icon: '🥤', desc: '2x Ki XP & Power Level for your next 3 quests' },
  { id: 'arena_pass', name: 'Hyperbolic Arena Pass', cost: 60, icon: '🎟️', desc: 'Grants +3 Ki Blitz Mini-Game charges' },
  { id: 'patty', name: 'Golden Secret Patty', cost: 180, icon: '🍔', desc: 'Permanently boosts Power Level by +1,500' },
  { id: 'thermos', name: 'Spectral Thermos Blast', cost: 220, icon: '🧪', desc: 'Instantly deals 120 DMG to the Daily Boss' },
  { id: 'sword', name: 'Demon Blood Blade', cost: 300, icon: '🗡️', desc: '+2,500 Power Level & equips Blade Icon' },
  { id: 'spatula', name: 'Neptune Golden Spatula', cost: 350, icon: '🔱', desc: '+3,500 Power Level & equips Trident Icon' },
  { id: 'whis', name: 'Angel Staff & Gi', cost: 500, icon: '👼', desc: 'God Ki Mastery: +6,000 Power Level' },
];

export default function App() {
  const [tab, setTab] = useState('quests'); // quests | arena | store | forms
  const [themeKey, setThemeKey] = useState('flame');

  const [player, setPlayer] = useState({
    name: 'Z-Fighter Joshua',
    level: 1,
    xp: 25,
    zeni: 950,
    powerLevel: 1250,
    senzuBeans: 2,
    slushieBuffs: 0,
    dragonBalls: 3,
    arenaCharges: 3,
    highScore: 0,
    bossName: 'Majin Overlord',
    bossHp: 250,
    bossMax: 250,
    customIcon: null,
  });

  const [habits, setHabits] = useState([
    { id: '1', title: '100x Gravity Chamber Workout', xp: 50, zeni: 150, pl: 600, icon: '🐉', streak: 5, done: false },
    { id: '2', title: 'Ghost Zone 2.5h Study Sprint', xp: 65, zeni: 200, pl: 850, icon: '👻', streak: 6, done: false },
    { id: '3', title: 'Dungeon Train Focus Coding', xp: 55, zeni: 170, pl: 700, icon: '🗡️', streak: 4, done: false },
    { id: '4', title: 'Brain-Freeze Hydration (500ml)', xp: 35, zeni: 100, pl: 350, icon: '🥤', streak: 7, done: false },
    { id: '5', title: 'Golden Spatula Morning Prep', xp: 40, zeni: 120, pl: 400, icon: '🍔', streak: 3, done: false },
  ]);

  const [customRewards, setCustomRewards] = useState([
    { id: 'c1', title: '1 Hour Gaming Session', cost: 250, icon: '🎮' },
    { id: 'c2', title: 'Favorite Cheat Meal', cost: 400, icon: '🥩' },
  ]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Mini-Game (Ki Blitz 3x3 Grid) state
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(12);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gridCells, setGridCells] = useState(Array(9).fill(null));
  const gameTimerRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const scoreRef = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const p = await AsyncStorage.getItem('@hq_s25_p');
        const h = await AsyncStorage.getItem('@hq_s25_h');
        if (p) setPlayer(JSON.parse(p));
        if (h) setHabits(JSON.parse(h));
      } catch (e) {}
    })();

    return () => {
      clearInterval(gameTimerRef.current);
      clearInterval(spawnTimerRef.current);
    };
  }, []);

  const saveState = async (nextP, nextH) => {
    try {
      if (nextP) await AsyncStorage.setItem('@hq_s25_p', JSON.stringify(nextP));
      if (nextH) await AsyncStorage.setItem('@hq_s25_h', JSON.stringify(nextH));
    } catch (e) {}
  };

  const currentForm = FORMS.slice().reverse().find(f => player.level >= f.lv) || FORMS[0];
  const theme = AURA_THEMES[themeKey] || AURA_THEMES.flame;

  // Helper to apply XP, Level-ups, and Boss Damage
  const applyRewards = (basePlayer, gainXP, gainZeni, gainPL, bossDmg) => {
    let nextP = { ...basePlayer };
    nextP.xp += gainXP;
    nextP.zeni += gainZeni;
    nextP.powerLevel += gainPL;
    nextP.bossHp = Math.max(0, nextP.bossHp - bossDmg);

    if (bossDmg > 0 && nextP.bossHp === 0) {
      nextP.zeni += 300;
      nextP.dragonBalls = Math.min(7, nextP.dragonBalls + 1);
      nextP.bossMax += 100;
      nextP.bossHp = nextP.bossMax;
      Alert.alert('👾 BOSS DEFEATED!', 'You obliterated the Daily Boss!\n+300 Zeni & +1 Dragon Ball! 🐉');
    }

    while (nextP.xp >= XP_REQ(nextP.level)) {
      nextP.xp -= XP_REQ(nextP.level);
      nextP.level += 1;
      nextP.zeni += 250;
      nextP.powerLevel += 2500;
      const newForm = FORMS.slice().reverse().find(f => nextP.level >= f.lv) || FORMS[0];
      Alert.alert('⚡ TRANSFORMATION UNLOCKED!', `Level ${nextP.level}: ${newForm.name}!\n+2,500 Power Level & +250 Zeni!`);
    }
    return nextP;
  };

  const toggleQuest = (id) => {
    let nextP = { ...player };
    const nextH = habits.map(h => {
      if (h.id !== id) return h;
      const done = !h.done;
      const buffMult = (done && nextP.slushieBuffs > 0) ? 2 : 1;
      const gainedXP = Math.round(h.xp * buffMult);
      const gainedPL = Math.round(h.pl * currentForm.mult * buffMult);

      if (done) {
        if (nextP.slushieBuffs > 0) nextP.slushieBuffs -= 1;
        nextP.arenaCharges += 1;
        nextP = applyRewards(nextP, gainedXP, h.zeni, gainedPL, 50);
      } else {
        nextP.xp = Math.max(0, nextP.xp - h.xp);
        nextP.zeni = Math.max(0, nextP.zeni - h.zeni);
        nextP.powerLevel = Math.max(0, nextP.powerLevel - h.pl);
      }
      return { ...h, done, streak: done ? h.streak + 1 : Math.max(0, h.streak - 1) };
    });

    setPlayer(nextP);
    setHabits(nextH);
    saveState(nextP, nextH);
  };

  // --- MINI-GAME: KI BLITZ LOGIC ---
  const spawnTargets = () => {
    const nextGrid = Array(9).fill(null);
    const count = Math.random() > 0.45 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * 9);
      const roll = Math.random();
      if (roll < 0.62) nextGrid[idx] = { type: 'ki', icon: '⚡', pts: 15 };
      else if (roll < 0.80) nextGrid[idx] = { type: 'dragon', icon: '🐉', pts: 35 };
      else nextGrid[idx] = { type: 'bomb', icon: '💣', pts: -20 };
    }
    setGridCells(nextGrid);
  };

  const startMiniGame = () => {
    if (player.arenaCharges <= 0) {
      Alert.alert('Out of Arena Charges', 'Complete a daily habit (+1 Charge) or grab an Arena Pass in the Shop!');
      return;
    }

    const updatedP = { ...player, arenaCharges: player.arenaCharges - 1 };
    setPlayer(updatedP);
    saveState(updatedP, null);

    scoreRef.current = 0;
    setScore(0);
    setCombo(0);
    setTimeLeft(12);
    setGameActive(true);
    spawnTargets();

    clearInterval(gameTimerRef.current);
    clearInterval(spawnTimerRef.current);

    spawnTimerRef.current = setInterval(spawnTargets, 680);
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endMiniGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endMiniGame = () => {
    clearInterval(gameTimerRef.current);
    clearInterval(spawnTimerRef.current);
    setGameActive(false);
    setGridCells(Array(9).fill(null));

    const finalScore = Math.max(0, scoreRef.current);
    const earnedZeni = Math.max(15, Math.round(finalScore * 0.8));
    const earnedXP = Math.max(10, Math.round(finalScore * 0.25));
    const earnedPL = finalScore * 4;
    const bossDmg = Math.max(15, Math.round(finalScore * 0.4));

    setPlayer(prev => {
      let nextP = applyRewards(prev, earnedXP, earnedZeni, earnedPL, bossDmg);
      if (finalScore > nextP.highScore) nextP.highScore = finalScore;
      saveState(nextP, null);
      return nextP;
    });

    Alert.alert(
      '⚡ KI BLITZ COMPLETE!',
      `Score: ${finalScore}\n\nRewards Earned:\n• +${earnedZeni} Zeni 🪙\n• +${earnedXP} Ki XP ⚡\n• +${earnedPL} Power Level 🔥\n• ${bossDmg} Boss Damage 💥`
    );
  };

  const tapGridCell = (index) => {
    if (!gameActive) return;
    const target = gridCells[index];
    if (!target) return;

    const nextGrid = [...gridCells];
    nextGrid[index] = null;
    setGridCells(nextGrid);

    if (target.type === 'bomb') {
      setCombo(0);
      scoreRef.current = Math.max(0, scoreRef.current + target.pts);
    } else {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      const bonus = nextCombo >= 3 ? 5 : 0;
      scoreRef.current += target.pts + bonus;
    }
    setScore(scoreRef.current);
  };

  const buyItem = (item) => {
    if (player.zeni < item.cost) {
      Alert.alert('Need More Zeni!', `You need ${item.cost} Zeni for ${item.name}.`);
      return;
    }
    let nextP = { ...player, zeni: player.zeni - item.cost };
    if (item.id === 'senzu') nextP.senzuBeans += 1;
    else if (item.id === 'slushie') nextP.slushieBuffs += 3;
    else if (item.id === 'arena_pass') nextP.arenaCharges += 3;
    else if (item.id === 'patty') nextP.powerLevel += 1500;
    else if (item.id === 'thermos') nextP.bossHp = Math.max(0, nextP.bossHp - 120);
    else if (item.id === 'sword') { nextP.powerLevel += 2500; nextP.customIcon = '🗡️'; }
    else if (item.id === 'spatula') { nextP.powerLevel += 3500; nextP.customIcon = '🔱'; }
    else if (item.id === 'whis') { nextP.powerLevel += 6000; nextP.customIcon = '👼'; }

    setPlayer(nextP);
    saveState(nextP, null);
    Alert.alert('Capsule Corp Purchase! 🛍️', `Acquired ${item.name}!`);
  };

  const summonShenron = () => {
    if (player.dragonBalls < 7) {
      if (player.zeni < 300) {
        Alert.alert('Dragon Radar', `You have ${player.dragonBalls}/7 Dragon Balls. Spend 300 Zeni to locate the next one!`);
        return;
      }
      const nextP = { ...player, zeni: player.zeni - 300, dragonBalls: player.dragonBalls + 1 };
      setPlayer(nextP);
      saveState(nextP, null);
      Alert.alert('🐉 Dragon Ball Found!', `You now have ${nextP.dragonBalls}/7 Dragon Balls!`);
    } else {
      const nextP = {
        ...player,
        dragonBalls: 0,
        level: player.level + 1,
        powerLevel: player.powerLevel + 9001,
        zeni: player.zeni + 500,
      };
      setPlayer(nextP);
      saveState(nextP, null);
      Alert.alert('🐉 SHENRON SUMMONED!', 'IT’S OVER 9000!! Wish granted: +1 Level, +9,001 PL & +500 Zeni!');
    }
  };

  const maxXP = XP_REQ(player.level);
  const xpPct = Math.min(100, Math.floor((player.xp / maxXP) * 100));
  const bossPct = Math.min(100, Math.floor((player.bossHp / player.bossMax) * 100));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg, paddingTop: TOP_INSET }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} translucent />

      {/* S25 Scouter & Power Level HUD */}
      <View style={[styles.hud, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.hudRow}>
          <View style={[styles.avatarBox, { borderColor: currentForm.aura }]}>
            <Text style={{ fontSize: 28 }}>{player.customIcon || currentForm.icon}</Text>
            <View style={[styles.lvBadge, { backgroundColor: theme.accent }]}>
              <Text style={styles.lvTxt}>LV {player.level}</Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.formLabel, { color: currentForm.aura }]}>{currentForm.name}</Text>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.subStats}>
              🟢 {player.senzuBeans} Senzu • 🎟️ {player.arenaCharges} Arena • 🐉 {player.dragonBalls}/7
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.zeniTxt}>🪙 {player.zeni}</Text>
            <Text style={styles.plTxt}>⚡ {player.powerLevel.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${xpPct}%`, backgroundColor: theme.accent }]} />
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.xpSub}>{player.xp} / {maxXP} Ki XP</Text>
          <Text style={styles.xpSub}>{currentForm.mult}x Form Multiplier</Text>
        </View>
      </View>

      {/* Aura Theme Selector */}
      <View style={{ height: 40, marginBottom: 6 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
          {Object.keys(AURA_THEMES).map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.auraPill, themeKey === k && { backgroundColor: theme.accent, borderColor: '#fff' }]}
              onPress={() => setThemeKey(k)}
            >
              <Text style={styles.auraPillTxt}>{AURA_THEMES[k].name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 14 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {tab === 'quests' && (
          <View>
            {/* Boss Raid Banner */}
            <View style={[styles.bossCard, { borderColor: theme.border }]}>
              <Text style={{ fontSize: 30, marginRight: 12 }}>👾</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bossTitle}>BOSS RAID: {player.bossName}</Text>
                <View style={styles.bossTrack}>
                  <View style={[styles.bossFill, { width: `${bossPct}%` }]} />
                </View>
                <Text style={styles.bossSub}>HP: {player.bossHp}/{player.bossMax} • Complete quests or play Arena to strike!</Text>
              </View>
            </View>

            <View style={[styles.rowBetween, { marginBottom: 10 }]}>
              <Text style={styles.sectionTitle}>Daily Quests</Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.accent }]} onPress={() => setModalVisible(true)}>
                <Text style={styles.addBtnTxt}>+ Add Quest</Text>
              </TouchableOpacity>
            </View>

            {habits.map(h => (
              <TouchableOpacity
                key={h.id}
                activeOpacity={0.8}
                style={[styles.questCard, { backgroundColor: theme.card, borderColor: theme.border }, h.done && styles.questDone]}
                onPress={() => toggleQuest(h.id)}
              >
                <Text style={{ fontSize: 26, marginRight: 12 }}>{h.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.questTitle, h.done && styles.questTitleDone]}>{h.title}</Text>
                  <Text style={styles.questMeta}>
                    +{h.xp} XP • +{h.zeni} Zeni • +{h.pl} PL • 🔥 {h.streak}d
                  </Text>
                </View>
                <View style={[styles.checkBox, { borderColor: theme.accent }, h.done && styles.checkBoxDone]}>
                  <Text style={{ color: '#000', fontWeight: '900' }}>{h.done ? '✓' : ''}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 'arena' && (
          <View>
            <View style={[styles.bossCard, { borderColor: theme.accent, backgroundColor: theme.card }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>⚡ Ki Blitz Training Arena</Text>
                <Text style={[styles.bossSub, { marginTop: 4 }]}>
                  Tap ⚡ (+15) and 🐉 (+35) before they vanish. Avoid 💣 (-20)! Scores convert directly into Zeni, XP, and Boss Damage.
                </Text>
              </View>
            </View>

            {/* Scoreboard */}
            <View style={[styles.arenaStatsRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.arenaStatItem}>
                <Text style={styles.arenaStatLbl}>TIME</Text>
                <Text style={[styles.arenaStatVal, { color: timeLeft <= 3 && gameActive ? '#f43f5e' : '#fff' }]}>{timeLeft}s</Text>
              </View>
              <View style={styles.arenaStatItem}>
                <Text style={styles.arenaStatLbl}>SCORE</Text>
                <Text style={[styles.arenaStatVal, { color: '#facc15' }]}>{score}</Text>
              </View>
              <View style={styles.arenaStatItem}>
                <Text style={styles.arenaStatLbl}>COMBO</Text>
                <Text style={[styles.arenaStatVal, { color: '#38bdf8' }]}>{combo}x</Text>
              </View>
              <View style={styles.arenaStatItem}>
                <Text style={styles.arenaStatLbl}>BEST</Text>
                <Text style={[styles.arenaStatVal, { color: '#10b981' }]}>{player.highScore}</Text>
              </View>
            </View>

            {/* 3x3 Interactive Grid */}
            <View style={styles.arenaGrid}>
              {gridCells.map((cell, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={[
                    styles.gridCell,
                    { backgroundColor: theme.card, borderColor: cell ? theme.accent : '#1e293b' },
                    cell?.type === 'dragon' && { borderColor: '#facc15', backgroundColor: '#2a1b02' },
                    cell?.type === 'bomb' && { borderColor: '#f43f5e', backgroundColor: '#2b0912' },
                  ]}
                  onPress={() => tapGridCell(idx)}
                >
                  <Text style={{ fontSize: 34 }}>{cell ? cell.icon : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!gameActive ? (
              <TouchableOpacity
                style={[styles.startArenaBtn, { backgroundColor: theme.accent }]}
                onPress={startMiniGame}
              >
                <Text style={styles.startArenaTxt}>
                  START KI BLITZ (Uses 1 🎟️ • {player.arenaCharges} Left)
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.startArenaBtn, { backgroundColor: '#1e293b' }]}>
                <Text style={styles.startArenaTxt}>TRAINING IN PROGRESS... TAP FAST!</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'store' && (
          <View>
            <View style={[styles.bossCard, { backgroundColor: '#231702', borderColor: '#facc15' }]}>
              <Text style={{ fontSize: 30, marginRight: 12 }}>🐉</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bossTitle, { color: '#facc15' }]}>
                  {player.dragonBalls >= 7 ? 'SUMMON SHENRON NOW!' : `Dragon Radar (${player.dragonBalls}/7 Balls)`}
                </Text>
                <Text style={styles.bossSub}>
                  {player.dragonBalls >= 7 ? 'Wish: +9,001 Power Level & +1 Level!' : 'Spend 300 Zeni to locate the next Dragon Ball!'}
                </Text>
              </View>
              <TouchableOpacity style={styles.goldBtn} onPress={summonShenron}>
                <Text style={styles.goldBtnTxt}>{player.dragonBalls >= 7 ? 'WISH!' : '300 🪙'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginVertical: 8 }]}>Capsule Corp Armory</Text>
            {CAPSULE_SHOP.map(item => (
              <View key={item.id} style={[styles.questCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={{ fontSize: 28, marginRight: 12 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questTitle}>{item.name}</Text>
                  <Text style={styles.questMeta}>{item.desc}</Text>
                </View>
                <TouchableOpacity style={styles.goldBtn} onPress={() => buyItem(item)}>
                  <Text style={styles.goldBtnTxt}>🪙 {item.cost}</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginVertical: 8 }]}>Real-World Rewards</Text>
            {customRewards.map(r => (
              <View key={r.id} style={[styles.questCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={{ fontSize: 26, marginRight: 12 }}>{r.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questTitle}>{r.title}</Text>
                  <Text style={styles.zeniTxt}>🪙 {r.cost} Zeni</Text>
                </View>
                <TouchableOpacity
                  style={styles.goldBtn}
                  onPress={() => {
                    if (player.zeni < r.cost) { Alert.alert('Need Zeni', `Requires ${r.cost} Zeni.`); return; }
                    const nextP = { ...player, zeni: player.zeni - r.cost };
                    setPlayer(nextP);
                    saveState(nextP, null);
                    Alert.alert('Reward Claimed! 🎉', `Enjoy: ${r.title}!`);
                  }}
                >
                  <Text style={styles.goldBtnTxt}>Redeem</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tab === 'forms' && (
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Transformation Mastery</Text>
            {FORMS.map(f => {
              const unlocked = player.level >= f.lv;
              return (
                <View key={f.lv} style={[styles.questCard, { backgroundColor: theme.card, borderColor: unlocked ? f.aura : '#27272a', opacity: unlocked ? 1 : 0.45 }]}>
                  <Text style={{ fontSize: 28, marginRight: 12 }}>{f.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.questTitle, { color: f.aura }]}>{f.name}</Text>
                    <Text style={styles.questMeta}>Unlocks at Level {f.lv} • {f.mult}x Power Level Multiplier</Text>
                  </View>
                  <Text style={{ color: unlocked ? '#10b981' : '#64748b', fontWeight: '900', fontSize: 12 }}>
                    {unlocked ? 'UNLOCKED' : `LV ${f.lv}`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* S25 Gesture-Safe Bottom Bar */}
      <View style={[styles.nav, { borderColor: theme.border, backgroundColor: theme.bg }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setTab('quests')}>
          <Text style={[styles.navTxt, tab === 'quests' && { color: theme.accent }]}>⚡ Quests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => setTab('arena')}>
          <Text style={[styles.navTxt, tab === 'arena' && { color: theme.accent }]}>🎮 Arena</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => setTab('store')}>
          <Text style={[styles.navTxt, tab === 'store' && { color: theme.accent }]}>🏪 Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => setTab('forms')}>
          <Text style={[styles.navTxt, tab === 'forms' && { color: theme.accent }]}>🔥 Forms</Text>
        </TouchableOpacity>
      </View>

      {/* Add Quest Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.sectionTitle}>Add Daily Habit Quest</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 30m Gravity Workout, Read 15 Pages"
              placeholderTextColor="#94a3b8"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 10 }}>
                <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: theme.accent }]}
                onPress={() => {
                  if (!newTitle.trim()) return;
                  const nextH = [
                    { id: String(Date.now()), title: newTitle.trim(), xp: 50, zeni: 140, pl: 500, icon: '⚡', streak: 0, done: false },
                    ...habits
                  ];
                  setHabits(nextH);
                  saveState(player, nextH);
                  setNewTitle('');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.addBtnTxt}>Save Quest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hud: { marginHorizontal: 14, marginBottom: 10, padding: 14, borderRadius: 22, borderWidth: 1.5 },
  hudRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarBox: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#000', borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  lvBadge: { position: 'absolute', bottom: -6, right: -6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  lvTxt: { color: '#fff', fontSize: 9, fontWeight: '900' },
  formLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  playerName: { color: '#fff', fontSize: 17, fontWeight: '900' },
  subStats: { color: '#cbd5e1', fontSize: 10, marginTop: 2 },
  zeniTxt: { color: '#facc15', fontWeight: '900', fontSize: 14 },
  plTxt: { color: '#38bdf8', fontWeight: '900', fontSize: 12, marginTop: 2 },
  barTrack: { height: 9, backgroundColor: '#000', borderRadius: 5, overflow: 'hidden', marginVertical: 6 },
  barFill: { height: '100%' },
  xpSub: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  auraPill: { backgroundColor: '#111827', paddingHorizontal: 13, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#27272a', justifyContent: 'center' },
  auraPillTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  bossCard: { backgroundColor: '#191438', padding: 13, borderRadius: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 14, borderWidth: 1.5 },
  bossTitle: { color: '#fda4af', fontSize: 12, fontWeight: '900' },
  bossTrack: { height: 7, backgroundColor: '#000', borderRadius: 4, overflow: 'hidden', marginVertical: 5 },
  bossFill: { height: '100%', backgroundColor: '#f43f5e' },
  bossSub: { color: '#cbd5e1', fontSize: 10, lineHeight: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },
  questCard: { padding: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 9, borderWidth: 1.5 },
  questDone: { backgroundColor: '#052e22', borderColor: '#10b981' },
  questTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  questTitleDone: { textDecorationLine: 'line-through', color: '#a7f3d0' },
  questMeta: { color: '#94a3b8', fontSize: 11, marginTop: 3 },
  checkBox: { width: 28, height: 28, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  checkBoxDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  goldBtn: { backgroundColor: '#facc15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  goldBtnTxt: { color: '#000', fontWeight: '900', fontSize: 11 },
  arenaStatsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, borderRadius: 16, borderWidth: 1.5, marginBottom: 14 },
  arenaStatItem: { alignItems: 'center' },
  arenaStatLbl: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },
  arenaStatVal: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  arenaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  gridCell: { width: '30.5%', aspectRatio: 1, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  startArenaBtn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
  startArenaTxt: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.4 },
  nav: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, paddingBottom: Platform.OS === 'android' ? 18 : 22, borderTopWidth: 1 },
  navBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  navTxt: { color: '#94a3b8', fontSize: 12, fontWeight: '900' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { padding: 20, borderRadius: 22, borderWidth: 2 },
  input: { backgroundColor: '#000', color: '#fff', padding: 12, borderRadius: 12, marginVertical: 14, borderWidth: 1, borderColor: '#334155' }
});
