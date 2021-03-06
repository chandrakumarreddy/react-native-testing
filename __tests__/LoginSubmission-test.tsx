import 'react-native'
import React from 'react'
import {fireEvent, render, wait} from '@testing-library/react-native'
import LoginSubmission from "../src/components/LoginSubmission"
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-community/async-storage'
import {SCREENS} from '../App'

//mocking async storage module
jest.mock('@react-native-community/async-storage', ()=>({setItem: jest.fn()}))

//mocking react-navigation and its modulels
jest.mock('@react-navigation/native', () => {
  return {
    createNavigatorFactory: jest.fn(),
    useNavigation: jest.fn(),
  }
})
jest.mock('@react-navigation/stack', ()=> ({
  createStackNavigator: jest.fn()
}))
jest.mock('@react-native-community/masked-view', ()=> ({}))

beforeEach(() => {
  // @ts-ignore
  useNavigation.mockReset()
  // window.localStorage.removeItem('token')
})

it('renders correctly', async () => {
  const mockNavigate = jest.fn()
  // @ts-ignore
  useNavigation.mockImplementation(() => ({navigate: mockNavigate}))
  const fakeResponse = Promise.resolve({token: 'fake-token'})
  // @ts-ignore
  global.fetch.mockResolvedValueOnce({
    json: () => Promise.resolve({token: 'fake-token'}),
  })

  const username = 'chucknorris'
  const password = 'i need no password'
  const {getByText, getByPlaceholderText} =  render(<LoginSubmission/>)
  const button = getByText(/submit/i)

  await fireEvent.changeText(getByPlaceholderText(/username/i), username)
  await fireEvent.changeText(getByPlaceholderText(/password/i), password)
  fireEvent.press(button)

  await getByText(/loading/i)
  // @ts-ignore
  expect(global.fetch).toHaveBeenCalledWith('/api/login', {
    method: 'POST',
    body: JSON.stringify({username, password}),
    headers: {'content-type': 'application/json'},
  })
  // @ts-ignore
  expect(global.fetch.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "/api/login",
        Object {
          "body": "{\\"username\\":\\"chucknorris\\",\\"password\\":\\"i need no password\\"}",
          "headers": Object {
            "content-type": "application/json",
          },
          "method": "POST",
        },
      ],
    ]
  `)

  await wait(() => expect(mockNavigate).toHaveBeenCalledTimes(1))
  expect(AsyncStorage.setItem).toHaveBeenCalledWith("token", "fake-token")
  expect(mockNavigate).toHaveBeenCalledWith(SCREENS.HOME)
});
