import { Button } from '@chakra-ui/button'
import { Box } from '@chakra-ui/layout'
import React, { Component } from 'react'
import {Link} from 'react-router-dom'
import {Logo} from './Logo'
import { ArrowRightIcon } from '@chakra-ui/icons'
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

  function  Sidebar () {
        return (
            <VStack pl='5' pt='2' h='100vh' maxW='100%' align='left'>
                <Link  to='/topics'>
                    <Box p='2' py='3' mt='4' _hover={{bg:'gray.200'}} w='75%' borderRadius='lg' align='left'>
                        Topics
                    </Box>
                </Link>
                <Link to='/Profile'>
                    <Box p='2' py='3' mt='4' _hover={{bg:'gray.200'}} w='75%' borderRadius='lg'  align='left'>
                        Profile
                    </Box>
                </Link>
                <Link to='/Messages'>
                    <Box p='2' py='3' mt='4' _hover={{bg:'gray.200'}}  w='75%' borderRadius='lg'  align='left'>
                        Messages
                    </Box>
                </Link>
                <Link to='/Bookmarks'>
                    <Box p='2' py='3' mt='4' _hover={{bg:'gray.200'}}  w='75%' borderRadius='lg'  align='left'>
                        Bookmarks
                    </Box>
                </Link>                
            </VStack>
        )
}

export default Sidebar
