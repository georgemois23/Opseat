    import React, { useState } from 'react';
    import {
    Box,
    Container,
    TextField,
    Typography,
    Card,
    CardContent,
    Grid,
    AppBar,
    Toolbar,
    Rating,
    Button,
    } from '@mui/material';
    import opseat from "../assets/logos/opseat.svg";
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import api from '@/lib/axios';

    interface Restaurant {
    name: string;
    id: string;
    isDelivering: boolean;
    slug: string;
    }

    const AdminHome = () => {
    const {user, logout} = useAuth()        
    const categories: string[] = ['Pizza', 'Burgers', 'Sushi', 'Desserts'];
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(restaurants);
    const navigate = useNavigate(); 
    document.title = "OpsEat • Home"        
    const getRestaurantData = async () => {
        try {
        const data = await api.get('/restaurants/nearby')
        setRestaurants(data.data);
        setFilteredRestaurants(data.data);
        } catch (error) {
        console.error('Error fetching restaurants:', error);
        }
    };

    React.useEffect(() => {
        getRestaurantData();
    }, []);

    const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
    const findAllRestaurants = async () => {
        try {
        const data = await api.get('/restaurants/all')
        setAllRestaurants(data.data);
        } catch (error) {
        console.error('Error fetching restaurants:', error);
        }
    };




    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        
        {/* <Button variant="contained" color="primary" sx={{ mt: 4, borderRadius:4, p:2, width: '20%', marginInline:'auto' }} >
            Add New Address
        </Button> */}
        {/* <AddressManagementDrawer /> */}
        {/* Main Content */}
        <Container maxWidth="lg"  sx={{ py: 4, flexGrow: 1, }}>
            <TextField
            fullWidth
            placeholder="Search restaurants or dishes..."
            variant="outlined"
            sx={{ mb: 4 }}
            onChange={(e) => {
                const query = e.target.value.toLowerCase();
                setFilteredRestaurants(
                restaurants.filter((r) =>
                    r.name.toLowerCase().includes(query)
                )
                );
            }}
            />

            {/* Categories */}
            {/* <Typography variant="h5" sx={{ mb: 2 }}>
            Categories
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
            {categories.map((category) => (
                <Grid key={category} size={{ xs: 6, sm: 3 }}>
                <Card sx={{ cursor: 'pointer', textAlign: 'center' }}>
                    <CardContent>
                    <Typography>{category}</Typography>
                    </CardContent>
                </Card>
                </Grid>
            ))}
            </Grid> */}

            {/* Restaurants */}
            {/* <Typography variant="h5" sx={{ mb: 2 }}>
            Featured Restaurants
            </Typography> */}

            <Grid container spacing={2}>
            {filteredRestaurants
            .sort((a, b) => +b.isDelivering - +a.isDelivering)
            .map((restaurant) => (
                <Grid key={restaurant.name} size={{ xs: 12, sm: 6, }} sx={{opacity: restaurant.isDelivering ? 1 : 0.5}} onClick={() => navigate(`/restaurant/${restaurant.slug}`)}>
                <Card sx={{ cursor: 'pointer' }}>
                    <CardContent>
                    <Typography variant="h6">
                        {restaurant.name}
                    </Typography>

                {!restaurant.isDelivering && (
                    <Typography variant="caption" color="error">
                    Closed
                    </Typography>
                )}
                    <Typography color="text.secondary">
                        {/* {restaurant.cuisine} */}
                    </Typography>

                    {/* <Box
                        sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 1,
                        }}
                    >
                        <Rating
                        // value={restaurant.rating}
                        precision={0.5}
                        readOnly
                        size="small"
                        />
                        <Typography variant="body2">
                        • {restaurant.time}
                        </Typography>
                    </Box> */}
                    </CardContent>
                </Card>
                </Grid>
            ))}
            </Grid>
            <Button onClick={findAllRestaurants} variant="contained" color="primary" sx={{ mt: 4, borderRadius:4, p:2, width: '20%' }}>
            View All Restaurants
            </Button>
            <Grid container spacing={2}>
            {allRestaurants
            .sort((a, b) => +b.isDelivering - +a.isDelivering)
            .map((restaurant) => (
                <Grid key={restaurant.name} size={{ xs: 12, sm: 6, }} sx={{opacity: restaurant.isDelivering ? 1 : 0.5}} onClick={() => navigate(`/restaurant/${restaurant.slug}`)}>
                <Card sx={{ cursor: 'pointer' }}>
                    <CardContent>
                    <Typography variant="h6">
                        {restaurant.name}
                    </Typography>

                {!restaurant.isDelivering && (
                    <Typography variant="caption" color="error">
                    Closed
                    </Typography>
                )}
                    </CardContent>
                </Card>
                </Grid>
            ))}
            </Grid>
        </Container>

        {/* Footer */}
        <Box
            component="footer"
            sx={{
            textAlign: 'center',
            py: 2,
            bgcolor: '#f5f5f5',
            }}
        >
            <Typography variant="body2">
            © {new Date().getFullYear()} Food Delivery App
            </Typography>
        </Box>
        </Box>
    );
    };

    export default AdminHome;