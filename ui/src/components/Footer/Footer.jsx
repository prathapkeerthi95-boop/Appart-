import React from 'react';
import { Building2, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowRight, Github } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <footer className="main-footer">
            <div className="footer-top">
                <div className="footer-container">
                    <div className="footer-brand-section">
                        <div className="footer-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="logo-icon"><Building2 size={24} strokeWidth={2.5} /></div>
                            <span>Apartment Super App</span>
                        </div>
                        <p className="footer-description">
                            The total apartment experience. Reimagining modern living with intelligence, 
                            seamless payments, and a thriving community at its heart.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-icon" aria-label="Facebook"><Facebook size={18} /></a>
                            <a href="#" className="social-icon" aria-label="Twitter"><Twitter size={18} /></a>
                            <a href="#" className="social-icon" aria-label="Instagram"><Instagram size={18} /></a>
                            <a href="#" className="social-icon" aria-label="LinkedIn"><Linkedin size={18} /></a>
                        </div>
                    </div>

                    <div className="footer-links-grid">
                        <div className="footer-column">
                            <h3>Platform</h3>
                            <ul>
                                <li><button onClick={() => scrollToSection('intelligence')}>Intelligence</button></li>
                                <li><button onClick={() => scrollToSection('payments')}>Payments</button></li>
                                <li><button onClick={() => scrollToSection('community')}>Community</button></li>
                                <li><a href="#">Health Scores</a></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3>Company</h3>
                            <ul>
                                <li><a href="#">About Us</a></li>
                                <li><a href="#">Careers</a></li>
                                <li><a href="#">Privacy Policy</a></li>
                                <li><a href="#">Terms of Service</a></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3>Support</h3>
                            <ul>
                                <li><a href="#">Help Center</a></li>
                                <li><a href="#">Safety Center</a></li>
                                <li><a href="#">Community Guidelines</a></li>
                                <li><a href="#">Contact Support</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-newsletter">
                        <h3>Stay Updated</h3>
                        <p>Get the latest news and updates from our community.</p>
                        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <input type="email" placeholder="Your email address" required />
                            <button type="submit" aria-label="Subscribe">
                                <ArrowRight size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-container bottom-flex">
                    <div className="copyright">
                        &copy; {currentYear} Apartment Super App. All rights reserved.
                    </div>
                    <div className="footer-contact-info">
                        <div className="contact-item">
                            <Mail size={14} />
                            <span>hello@apartmentsuper.app</span>
                        </div>
                        <div className="contact-item">
                            <Phone size={14} />
                            <span>+1 (555) 000-0000</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
