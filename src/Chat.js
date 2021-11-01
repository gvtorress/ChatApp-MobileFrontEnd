import React, { useEffect, useState } from 'react'

import {
    Text,
    SafeAreaView,
    TextInput,
    StyleSheet,
    Button,
    View,
    ScrollView
} from 'react-native'
import { RadioButton } from 'react-native-paper'

import socketIOClient from 'socket.io-client'

import api from './config/configApi'

import {
    BotaoBasico,
    BotaoEnviarMsg,
    CampoFormulario,
    CampoMensagem,
    ContainerAcesso,
    ContainerChat,
    ConteudoCampoRadio,
    FormMensagem,
    ListarMensagem,
    TextoBotaoBasico,
    TextoBotaoEnviar,
    TituloAcesso,
    TituloCampo,
    TituloOpcaoRadio,
    MsgEnviada,
    DetMsgEnviada,
    MsgRecebida,
    DetMsgRecebida
} from './styles/styles'

let socket

function Chat() {
    const ENDPOINT = 'http://192.168.0.184:8080'

    const [logged, setLogged] = useState(false)
    const [email, setEmail] = useState('')
    const [roomId, setRoomId] = useState('')
    const [message, setMessage] = useState('')
    const [userId, setUserId] = useState('')
    const [name, setName] = useState('')
    const [messageList, setMessageList] = useState([])
    const [status, setStatus] = useState({
        type: '',
        message: ''
    })
    const [rooms, setRooms] = useState([])

    useEffect(() => {
        socket = socketIOClient(ENDPOINT)
        listRooms()
    }, [])

    useEffect(() => {
        socket.on('serverMessage', data => {
            setMessageList([...messageList, data])
        })
    })

    const connectRoom = async () => {
        const headers = {
            'Content-Type': 'application/json'
        }

        await api
            .post('/validateAccess', { email }, { headers })
            .then(response => {
                setName(response.data.user.name)
                setUserId(response.data.user.id)
                socket.emit('room_connect', Number(roomId))
                listMessages()
                setLogged(true)
            })
            .catch(err => {
                if (err.response) {
                    setStatus({
                        type: 'Error',
                        message: err.response.data.message
                    })
                } else {
                    setStatus({
                        type: 'Error',
                        message: 'Error: Try again later'
                    })
                }
            })
    }

    const listMessages = async () => {
        await api
            .get('/listMessages/' + roomId)
            .then(response => {
                setMessageList(response.data.messages)
            })
            .catch(err => {
                if (err.response) {
                    setStatus({
                        type: 'Error',
                        message: err.response.data.message
                    })
                } else {
                    setStatus({
                        type: 'Error',
                        message: 'Error: Try again later'
                    })
                }
            })
    }

    const sendMessage = async () => {
        const messageContent = {
            roomId: Number(roomId),
            content: {
                message: message,
                user: {
                    id: userId,
                    name: name
                }
            }
        }
        await socket.emit('message', messageContent)
        setMessageList([...messageList, messageContent.content])
        setMessage('')
    }

    const listRooms = async () => {
        await api
            .get('/listRooms')
            .then(response => {
                setRooms(response.data.rooms)
            })
            .catch(err => {
                if (err.response) {
                    setStatus({
                        type: 'Error',
                        message: err.response.data.message
                    })
                } else {
                    setStatus({
                        type: 'Error',
                        message: 'Error: Try again later'
                    })
                }
            })
    }

    return (
        <SafeAreaView style={styles.container}>
            {!logged ? (
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <ContainerAcesso>
                        <TituloAcesso>My Chat</TituloAcesso>
                        {status.type === 'Error' ? (
                            <View>
                                <Text>Failed to login: {status.message}</Text>
                            </View>
                        ) : (
                            <View></View>
                        )}
                        <TituloCampo>E-mail</TituloCampo>
                        <CampoFormulario
                            style={styles.input}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            placeholder="Coloque o seu E-mail"
                            value={email}
                            onChangeText={text => {
                                setEmail(text)
                            }}
                        />
                        <TituloCampo>Room:</TituloCampo>
                        {rooms.map(detRoom => {
                            return (
                                <ConteudoCampoRadio key={detRoom.id}>
                                    <RadioButton
                                        value={detRoom.name}
                                        status={
                                            roomId === detRoom.id
                                                ? 'checked'
                                                : 'unchecked'
                                        }
                                        onPress={() => setRoomId(detRoom.id)}
                                    />
                                    <TituloOpcaoRadio>
                                        {detRoom.name}
                                    </TituloOpcaoRadio>
                                </ConteudoCampoRadio>
                            )
                        })}
                        {/* <TextInput
                        style={styles.input}
                        placeholder="Room"
                        value={roomId}
                        onChangeText={text => {
                            setRoomId(text)
                        }}
                    /> */}
                        <BotaoBasico
                            color="#6fbced"
                            onPress={connectRoom}
                            title="Access"
                        >
                            <TextoBotaoBasico>Acessar</TextoBotaoBasico>
                        </BotaoBasico>
                    </ContainerAcesso>
                </ScrollView>
            ) : (
                <ContainerChat>
                    {/* {messageList.map((msg, key) => {
                            return (
                                <View key={key}>
                                    <Text>
                                        {msg.user.name}: {msg.message}
                                    </Text>
                                </View>
                            )
                        })} */}
                    <ListarMensagem
                        data={messageList}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <>
                                {item.user.id === userId ? (
                                    <MsgEnviada>
                                        <DetMsgEnviada>
                                            {item.user.name}: {item.message}
                                        </DetMsgEnviada>
                                    </MsgEnviada>
                                ) : (
                                    <MsgRecebida>
                                        <DetMsgRecebida>
                                            {item.user.name}: {item.message}
                                        </DetMsgRecebida>
                                    </MsgRecebida>
                                )}
                            </>
                        )}
                    />
                    <FormMensagem>
                        <CampoMensagem
                            style={styles.input}
                            placeholder="Message"
                            value={message}
                            onChangeText={text => {
                                setMessage(text)
                            }}
                        />
                        <BotaoEnviarMsg onPress={sendMessage} title="Send">
                            <TextoBotaoEnviar>Send</TextoBotaoEnviar>
                        </BotaoEnviarMsg>
                    </FormMensagem>
                </ContainerChat>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        margin: 20,
        padding: 25,
        flex: 1,
        backgroundColor: '#fff'
    },
    input: {
        height: 40,
        borderWidth: 1,
        padding: 10
    }
})

export default Chat
