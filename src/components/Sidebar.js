import { Button } from '@chakra-ui/button'
import { Box } from '@chakra-ui/layout'
import React, { Component } from 'react'
import {Link} from 'react-router-dom'
import {Logo} from './Logo'
import {SiGooglemessages} from 'react-icons/si'
import {ImHome} from 'react-icons/im'
import {GiTreeBranch} from 'react-icons/gi'
import {CgProfile} from 'react-icons/cg'
import { BsBookmark } from "react-icons/bs"
import { Icon } from '@chakra-ui/icons';
import {
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useDisclosure,
    Input,
    VStack,
  } from "@chakra-ui/react"

  function  Sidebar (props) {
        return (
            <VStack pl='5' pt='2' h='100vh' maxW='100%' align='left'>
                <Link  to='/topics' onClick={() => props.onCloseSearch()}>
                    <Box p='2' py='3' mt='4' _hover={{bg:'gray.200'}} fontSize='lg' w='75%' borderRadius='lg' align='left' fontWeight="semibold" lineHeight="tight">
                        <Icon as={GiTreeBranch} w={6} h={6}/> Topics
                    </Box>
                </Link>
                <Link to='/Profile' onClick={() => props.onCloseSearch()}>
                    <Box p='2' py='3' mt='4' _hover={{bg:'gray.200'}} fontSize='lg' w='75%' borderRadius='lg'  align='left' fontWeight="semibold" lineHeight="tight">
                        <Icon as={CgProfile} w={6} h={6}/>  Profile
                    </Box>
                </Link>
                <Link to='/Messages' onClick={() => props.onCloseSearch()}>
                    <Box p='2' py='3' mt='4' _hover={{bg:'gray.200'}} fontSize='lg' w='75%' borderRadius='lg'  align='left' fontWeight="semibold" lineHeight="tight">
                        <Icon as={SiGooglemessages} w={6} h={6}/>  Messages
                    </Box>
                </Link>
                <Link to='/Bookmarks' onClick={() => props.onCloseSearch()}>
                    <Box p='2' py='3' mt='4' _hover={{bg:'gray.200'}} fontSize='lg' w='75%' borderRadius='lg'  align='left' fontWeight="semibold" lineHeight="tight">
                        <Icon as={BsBookmark} w={6} h={6}/> Bookmarks
                    </Box>
                </Link>                
            </VStack>
        )
}

export default Sidebar
