import {describe,it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import App from '../src/ui/App.jsx';
describe('SUNDERLAND 2026 frontend',()=>{
 it('renders home and trip branding',()=>{render(<App/>);expect(screen.getByText(/ONE CITY/i)).toBeInTheDocument();});
 it('shows navigation sections',()=>{render(<App/>);expect(screen.getByText('Letovi')).toBeInTheDocument();expect(screen.getByText('Vlakovi')).toBeInTheDocument();});
});
