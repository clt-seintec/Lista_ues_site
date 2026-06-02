import pandas as pd
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

def main():
    print("Lendo a planilha original...")
    
    # Caminho absoluto para a leitura do arquivo original
    caminho_entrada = r"C:\Users\ivan.brandao\OneDrive - Secretaria da Educação do Estado de São Paulo\SEINTEC\Lista_ues_site\Lat_long_ues\UES_nome_endereco.csv"
    df = pd.read_csv(caminho_entrada, sep=";") 
    
    # Identificação para o servidor do OpenStreetMap
    geolocator = Nominatim(user_agent="busca_escolas_seintec_leste")
    
    # Controle de requisições para evitar o bloqueio (Timeout) do servidor gratuito
    geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.5, max_retries=3, error_wait_seconds=2.0)

    latitudes = []
    longitudes = []

    print(f"Buscando coordenadas para {len(df)} unidades escolares. Isso pode levar alguns minutos...")
    
    for index, row in df.iterrows():
        endereco = row['Endereço']
        # Concatenando cidade e estado para precisão da busca
        endereco_completo = f"{endereco}, Campinas, SP, Brasil"
        
        try:
            # timeout=10 dá tempo suficiente para o servidor processar a resposta
            location = geocode(endereco_completo, timeout=10)
            if location:
                latitudes.append(location.latitude)
                longitudes.append(location.longitude)
                print(f"[OK] {row['Nome da Unidade Escolar']}")
            else:
                latitudes.append(None)
                longitudes.append(None)
                print(f"[NÃO ENCONTRADO] {row['Nome da Unidade Escolar']}")
        except Exception as e:
            print(f"Erro ao buscar {endereco_completo}: {e}")
            latitudes.append(None)
            longitudes.append(None)

    # Inserindo as novas colunas no DataFrame
    df['Latitude'] = latitudes
    df['Longitude'] = longitudes

    # Caminho absoluto para salvar a nova planilha na mesma pasta
    caminho_saida = r"C:\Users\ivan.brandao\OneDrive - Secretaria da Educação do Estado de São Paulo\SEINTEC\Lista_ues_site\Lat_long_ues\UES_nome_endereco_com_latlon.csv"
    df.to_csv(caminho_saida, sep=";", index=False, encoding='utf-8-sig')
    
    print(f"\nProcesso concluído! Nova planilha salva em:\n{caminho_saida}")

if __name__ == "__main__":
    main()