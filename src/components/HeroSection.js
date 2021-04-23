import React from 'react'
import {Button} from './Button'
import '../App.css'
import './HeroSection.css'

function HeroSection() {
    return (
        <div className='hero-container'>
            <img src='./images/img-8.jpg' alt=''/>
            <h1>Start Browsing </h1>
            <p>Share with your friends</p>
            <div className='hero-btns'>
                <Button className='btns' buttonStyle='btn--outline' buttonSize='btn--large'>
                    Get Started
                </Button>
            </div>
        </div>
    )
}

export default HeroSection
