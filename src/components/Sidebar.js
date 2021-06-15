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
            <VStack pl='2' pt='2' h='100vh' maxW='100%' align='left'>
                <Link  to='/topics'>
                    <Button mt='4'  w='100%'>
                        Topics
                    </Button>
                </Link>
                <Link to='/Profile'>
                    <Button mt='4'  w='100%'>
                        Profile
                    </Button>
                </Link>
                <Link to='/Messages'>
                    <Button mt='4' w='100%'>
                        Messages
                    </Button>
                </Link>
                <Link to='/Bookmarks'>
                    <Button mt='4'  w='100%'>
                        Bookmarks
                    </Button>
                </Link>                
            </VStack>
        )
}

export default Sidebar
