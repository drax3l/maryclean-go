import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { api } from '../../core/api/axios';
import { useAuthStore } from '../../core/store/authStore';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // Enviamos el JSON puro limpiando espacios vacíos que pone el celular por accidente
      const cleanUsername = username.trim();
      const cleanPassword = password.trim();

      const response = await api.post('/auth/login', {
        username: cleanUsername,
        password: cleanPassword
      });

      // Log para ver EXACTAMENTE qué nos respondió el backend cuando hay éxito
      console.log("✅ RESPUESTA EXITOSA DEL BACKEND:", JSON.stringify(response.data, null, 2));

      // Extraemos token y empleado.
      const responseData = response.data?.data || response.data;
      const token = responseData?.token;
      const user = responseData?.empleado; // ¡AQUÍ ESTABA EL SECRETO! El backend lo llama 'empleado', no 'user'
      
      
      if (!token) {
         throw new Error("El backend no devolvió un token. Revisa la estructura de la respuesta.");
      }

      // Guardar en el store y en el dispositivo
      await setAuth(String(token), user);
      
    } catch (error: any) {
      const errorData = error.response?.data;
      const message = errorData?.message || error.message || 'Error de conexión con el servidor.';
      
      // Imprimir el error exacto en la terminal
      console.log("🔥 ERROR COMPLETO:", error.message);
      if (errorData) console.log("🔥 DATA DEL BACKEND:", JSON.stringify(errorData, null, 2));

      Alert.alert('Error de Login', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-background">
      <View className="items-center mb-10">
        <Text className="text-4xl font-bold text-primary mb-2">MaryClean</Text>
        <Text className="text-secondary text-base">Inicia sesión en tu cuenta POS</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-secondary font-medium mb-1 ml-1">Usuario / Correo</Text>
          <TextInput
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-secondary"
            placeholder="usuario123"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View className="mt-4">
          <Text className="text-secondary font-medium mb-1 ml-1">Contraseña</Text>
          <TextInput
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-secondary"
            placeholder="********"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          className={`w-full bg-primary rounded-lg py-4 items-center mt-8 ${loading ? 'opacity-70' : ''}`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-lg">Ingresar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
