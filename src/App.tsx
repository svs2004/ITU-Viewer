import React, { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, User, Mail, Phone, Calendar, MapPin, Briefcase, Shield } from 'lucide-react';

interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  data?: any;
}

interface PersonModelResponse {
  success: boolean;
  message?: string;
  data?: any;
}

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPersonModel, setIsLoadingPersonModel] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [response, setResponse] = useState<AuthResponse | null>(null);
  const [personModelResponse, setPersonModelResponse] = useState<PersonModelResponse | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authData, setAuthData] = useState<any | null>(null);
  const [appealText, setAppealText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [formData, setFormData] = useState({
    username: 'user9kKLBzt9QL6',
    password: 'p@s$9kKLBzt9QL6'
  });

  const getPersonModel = async (personId: number, token: string) => {
    setIsLoadingPersonModel(true);
    setPersonModelResponse(null);

    try {
      console.log('Запрос GetFullPersonModel с personId:', personId);
      console.log('Используемый токен:', token);

      const response = await fetch(`https://37.203.243.35:44317/api/Person/GetFullPersonModel?personId=${personId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();
      console.log('Ответ GetFullPersonModel:', data);
      
      setPersonModelResponse({
        success: response.ok,
        message: response.ok ? 'Данные пользователя получены успешно' : `Ошибка получения данных: ${response.status} ${response.statusText}`,
        data: data
      });
      
    } catch (error) {
      console.error('Ошибка запроса GetFullPersonModel:', error);
      setPersonModelResponse({
        success: false,
        message: `Ошибка подключения к серверу: ${(error as Error).message}`,
      });
    } finally {
      setIsLoadingPersonModel(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse(null);
    setPersonModelResponse(null);

    try {
      const response = await fetch('https://37.203.243.35:44317/api/Users/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();
      
      if (response.ok && data.token) {
        setAuthToken(data.token);
        setAuthData(data);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authData', JSON.stringify(data));
        console.log('Токен сохранен:', data.token);
        console.log('Данные авторизации сохранены:', data);
      }
      
      setResponse({
        success: response.ok,
        message: response.ok ? 'Успешный вход в систему' : `Ошибка входа: ${response.status} ${response.statusText}`,
        token: data.token,
        data: data
      });

      if (response.ok && data.token && data.personId) {
        console.log('Запускаем получение полной модели пользователя для personId:', data.personId);
        await getPersonModel(data.personId, data.token);
      }
      
    } catch (error) {
      console.error('Ошибка запроса:', error);
      setResponse({
        success: false,
        message: `Ошибка подключения к серверу: ${(error as Error).message}. 
        
ВАЖНО: Для работы с самоподписанным сертификатом необходимо:
1. Открыть https://37.203.243.35:44317 в новой вкладке
2. Принять предупреждение о безопасности
3. Вернуться к приложению и повторить попытку входа`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setResponse(null);
    setPersonModelResponse(null);
    setShowAppealForm(false);
    setAppealText('');
    setSelectedFiles([]);
    setFormData({
      username: 'user9kKLBzt9QL6',
      password: 'p@s$9kKLBzt9QL6'
    });
  };

  const getAuthToken = () => {
    return authToken || localStorage.getItem('authToken');
  };

  const getAuthData = () => {
    if (authData) return authData;
    const stored = localStorage.getItem('authData');
    return stored ? JSON.parse(stored) : null;
  };

  const clearAuthToken = () => {
    setAuthToken(null);
    setAuthData(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authData');
  };

  const submitAppeal = async (token: string, authData: any, userData: any) => {
    setIsSubmittingAppeal(true);

    try {
      // Подготавливаем MobileRequestSendModel
      const mobileRequestModel = {
        Text: appealText,
        mobilePersonModel: {
          PersonId: userData?.personId || 0,
          Name: userData?.name || '',
          Surename: userData?.surename || '',
          Patronymic: userData?.patronymic || '',
          ClientId: userData?.clientId || 0,
          PositionId: userData?.positionId || 0,
          OfficeId: userData?.officeId || 0,
          OurEmployee: userData?.ourEmployee || false,
          BirthDay: userData?.birthDay ? new Date(userData.birthDay).toISOString() : new Date().toISOString(),
          FileVolume: userData?.fileVolume || 0,
          Company: userData?.company || '',
          AttachmentVolume: userData?.attachmentVolume || 0,
          contactInformationModels: userData?.contactInformationModels?.map((contact: any) => ({
            Type: contact?.type || '',
            Value: contact?.value || '',
            PersonId: userData?.personId || 0
          })) || []
        }
      };

      // Создаем FormData
      const formData = new FormData();
      
      // Добавляем JSON-строку ПЕРВОЙ
      const requestModelString = JSON.stringify(mobileRequestModel);
      formData.append('requestModelString', requestModelString);
      
      // Потом добавляем файлы
      selectedFiles.forEach((file, index) => {
        formData.append('files', file);
      });
      
      console.log('Отправляем обращение:', mobileRequestModel);
      console.log('JSON-строка модели:', requestModelString);
      console.log('=== ДЕТАЛЬНАЯ ИНФОРМАЦИЯ ОБ ОТПРАВКЕ ===');
      console.log('1. Текст обращения:', appealText);
      console.log('2. Данные пользователя (userData):', userData);
      console.log('3. Токен авторизации:', token);
      console.log('4. Количество файлов:', selectedFiles.length);
      console.log('5. Список файлов:');
      selectedFiles.forEach((file, index) => {
        console.log(`   Файл ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toLocaleString()
        });
      });
      console.log('6. Полная модель MobileRequestSendModel:', mobileRequestModel);
      console.log('7. JSON-строка MobileRequestSendModel для requestModelString:');
      console.log(requestModelString);
      console.log('8. Длина JSON-строки:', requestModelString.length);
      
      // Проверяем, что FormData содержит правильные данные
      console.log('9. Проверка FormData:');
      for (let [key, value] of formData.entries()) {
        if (key === 'requestModelString') {
          console.log(`   ${key} (длина: ${(value as string).length}):`, value);
        } else {
          console.log(`   ${key}:`, typeof value === 'object' ? `File: ${(value as File).name}` : value);
        }
      }
      
      // Дополнительная проверка - получаем значение напрямую
      const directValue = formData.get('requestModelString');
      console.log('10. Прямое получение requestModelString:', directValue);
      console.log('11. Тип значения:', typeof directValue);
      
      console.log('=======================================');

      const response = await fetch('https://37.203.243.35:44317/api/Request/MobileAddWithFilesWeb', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // НЕ устанавливаем Content-Type для FormData - браузер сделает это автоматически
        },
        body: formData,
        mode: 'cors',
        credentials: 'omit',
      });

      const result = await response.json();
      console.log('Ответ сервера:', result);

      if (response.ok) {
        // Успешная отправка
        alert('Обращение успешно отправлено!');
        setShowAppealForm(false);
        setAppealText('');
        setSelectedFiles([]);
      } else {
        // Ошибка отправки
        alert(`Ошибка отправки обращения: ${result.message || response.statusText}`);
      }

    } catch (error) {
      console.error('Ошибка отправки обращения:', error);
      alert(`Ошибка подключения к серверу: ${(error as Error).message}`);
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Не указано';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleAppealSubmit = () => {
    const token = getAuthToken();
    const authData = getAuthData();
    
    if (!token || !authData || !personModelResponse?.data) {
      console.error('Нет данных для отправки обращения');
      return;
    }
    
    submitAppeal(token, authData, personModelResponse.data);
  };

  if (response && response.success && personModelResponse && personModelResponse.success) {
    const userData = personModelResponse.data;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Профиль пользователя</h1>
                  <p className="text-green-600 font-medium">Авторизация успешна</p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
              >
                Назад
              </button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mr-6">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">
                    {userData?.name || 'Имя не указано'} {userData?.surename || ''}
                  </h2>
                  <p className="text-blue-100 text-lg">
                    {userData?.patronymic || 'Отчество не указано'}
                  </p>
                  <div className="flex items-center mt-2">
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="text-sm">ID: {userData?.personId || 'Не указан'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Action Buttons Column */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Действия
                  </h3>
                  
                  <button 
                    onClick={() => setShowAppealForm(true)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Отправить обращение
                  </button>
                  
                  <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Мои обращения
                  </button>
                </div>

                {/* Content Area - Personal Information or Appeal Form */}
                {!showAppealForm ? (
                  /* Personal Information */
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Личная информация
                    </h3>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Фамилия</label>
                      <div className="text-lg font-semibold text-gray-800">
                        {userData?.surename || 'Не указана'}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Имя</label>
                      <div className="text-lg font-semibold text-gray-800">
                        {userData?.name || 'Не указано'}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Отчество</label>
                      <div className="text-lg font-semibold text-gray-800">
                        {userData?.patronymic || 'Не указано'}
                      </div>
                    </div>

                    {/* Контактная информация */}
                    {userData?.contactInformationModels && userData.contactInformationModels.length > 0 && (
                      <>
                        {userData.contactInformationModels.map((contact: any, index: number) => {
                          if (contact.type === 'Phone') { // Телефон
                            return (
                              <div key={index} className="bg-gray-50 rounded-xl p-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
                                  <Phone className="w-4 h-4 mr-1" />
                                  Телефон
                                </label>
                                <div className="text-lg font-semibold text-gray-800">
                                  {contact.value || 'Не указан'}
                                </div>
                              </div>
                            );
                          }
                          if (contact.type === 'Email') { // Email
                            return (
                              <div key={index} className="bg-gray-50 rounded-xl p-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
                                  <Mail className="w-4 h-4 mr-1" />
                                  Email
                                </label>
                                <div className="text-lg font-semibold text-gray-800">
                                  {contact.value || 'Не указан'}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </>
                    )}
                  </div>
                ) : (
                  /* Appeal Form */
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Отправить обращение
                    </h3>
                    
                    {/* Appeal Text Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Кратко укажите причину обращения
                      </label>
                      <textarea
                        value={appealText}
                        onChange={(e) => setAppealText(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 bg-white resize-none"
                        placeholder="Опишите вашу проблему или вопрос..."
                      />
                    </div>

                    {/* File Upload Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Прикрепленные файлы
                      </label>
                      
                      {/* File Input */}
                      <div className="mb-4">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                          accept="*/*"
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 cursor-pointer"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Прикрепить файлы
                        </label>
                      </div>

                      {/* Selected Files List */}
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center">
                                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700 transition duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => setShowAppealForm(false)}
                        className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition duration-200"
                      >
                        Назад
                      </button>
                      
                      <button
                        onClick={handleAppealSubmit}
                        disabled={!appealText.trim() || isSubmittingAppeal}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingAppeal ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Отправка...
                          </div>
                        ) : (
                          'Отправить обращение'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Вернуться к авторизации
                </button>
                <button
                  onClick={clearAuthToken}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition duration-200"
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingPersonModel && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 mt-6 border border-white/20">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-700 font-medium">Загрузка данных пользователя...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (response) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                response.success 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {response.success ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {response.success ? 'Авторизация успешна!' : 'Ошибка авторизации'}
              </h2>
              <p className="text-gray-600 mb-4">{response.message}</p>
            </div>

            {isLoadingPersonModel && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-700 font-medium">Загрузка данных пользователя...</span>
                </div>
              </div>
            )}

            <button
              onClick={resetForm}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Вернуться к форме
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              Добро пожаловать
            </h1>
            <p className="text-gray-600 mt-2">
              Войдите в свою учетную запись
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Form */}
          {isLogin ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Логин
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Введите логин"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Введите пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Вход...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LogIn className="w-5 h-5 mr-2" />
                    Войти
                  </div>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Форма регистрации будет реализована позже
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;