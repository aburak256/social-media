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
  } from "@chakra-ui/react"

  function  Sidebar () {

    const { isOpen, onOpen, onClose } = useDisclosure()
    const btnRef = React.useRef()
        return (
            <Box pl='2' pt='2'>
                <Button ref={btnRef} colorScheme="teal" onClick={onOpen}>
                    <ArrowRightIcon/>
                </Button>
                <Drawer
                    isOpen={isOpen}
                    placement="left"
                    onClose={onClose}
                    finalFocusRef={btnRef}
                >
                    <DrawerOverlay />
                    <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader><Logo /></DrawerHeader>

                    <DrawerBody>
                        <Link  to='/topics'>
                            <Button mt='4' bg='teal.500' w='100%'>
                                Topics
                            </Button>
                        </Link>
                        <Link to='/Profile'>
                            <Button mt='4' bg='teal.500' w='100%'>
                                Profile
                            </Button>
                        </Link>
                        <Link to='/Messages'>
                            <Button mt='4' bg='blue.500' w='100%'>
                                Messages
                            </Button>
                        </Link>
                        <Link to='/Bookmarks'>
                            <Button mt='4' bg='blue.500' w='100%'>
                                Bookmarks
                            </Button>
                        </Link>
                    </DrawerBody>

                    <DrawerFooter>
                        <Button bg='teal.500' variant="outline" mr={3} onClick={onClose}>
                        Close
                        </Button>
                    </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            </Box>
        )
}

export default Sidebar
